from __future__ import annotations

import asyncio
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from typing import Callable, Literal

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request, status

AppRole = Literal["admin", "staff", "viewer"]
logger = logging.getLogger(__name__)
ASYMMETRIC_JWT_ALGORITHMS = {"ES256", "RS256"}


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    role: AppRole
    token: str


def _normalize_supabase_url(raw_url: str | None) -> str:
    if not raw_url:
        return ""
    return (
        raw_url.strip()
        .rstrip("/")
        .removesuffix("/rest/v1")
        .removesuffix("/auth/v1")
        .rstrip("/")
    )


def _get_bearer_token(request: Request) -> str:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token.strip()


@lru_cache(maxsize=8)
def _get_jwk_client(supabase_url: str) -> PyJWKClient:
    return PyJWKClient(f"{supabase_url}/auth/v1/.well-known/jwks.json")


def _decode_jwt(
    token: str,
    key: str | object,
    algorithm: str,
    supabase_url: str,
) -> dict:
    return jwt.decode(
        token,
        key,
        algorithms=[algorithm],
        audience="authenticated",
        issuer=f"{supabase_url}/auth/v1",
    )


def _verify_supabase_jwt(token: str) -> dict:
    supabase_url = _normalize_supabase_url(os.getenv("SUPABASE_URL"))
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase JWT verification is not configured.",
        )

    try:
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg")
    except jwt.PyJWTError as exc:
        logger.warning("JWT header parsing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if algorithm == "HS256" and not jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase legacy JWT verification is not configured.",
        )

    if algorithm != "HS256" and algorithm not in ASYMMETRIC_JWT_ALGORITHMS:
        logger.warning("JWT verification failed: unsupported alg %s", algorithm)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        if algorithm == "HS256":
            return _decode_jwt(token, jwt_secret, algorithm, supabase_url)

        signing_key = _get_jwk_client(supabase_url).get_signing_key_from_jwt(token)
        return _decode_jwt(token, signing_key.key, algorithm, supabase_url)
    except jwt.ExpiredSignatureError:
        logger.warning("JWT verification failed: token expired")
    except jwt.InvalidAudienceError:
        logger.warning("JWT verification failed: invalid audience")
    except jwt.InvalidIssuerError:
        logger.warning("JWT verification failed: invalid issuer")
    except jwt.InvalidSignatureError:
        logger.warning("JWT verification failed: invalid signature")
    except jwt.PyJWKClientError as exc:
        logger.warning("JWT verification failed: signing key lookup failed: %s", exc)
    except jwt.PyJWTError as exc:
        logger.warning("JWT verification failed: %s", exc)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _fetch_user_profile(token: str, user_id: str) -> dict:
    supabase_url = _normalize_supabase_url(os.getenv("SUPABASE_URL"))
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase profile lookup is not configured.",
        )

    query = urllib.parse.urlencode(
        {
            "id": f"eq.{user_id}",
            "select": "id,email,role",
        }
    )
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/user_profiles?{query}",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            profiles = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unable to read user profile for this account.",
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase profile lookup failed.",
        )
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase profile lookup failed.",
        )

    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No user profile found for this account.",
        )

    profile = profiles[0]
    role = profile.get("role")
    if role not in ("admin", "staff", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile does not have a valid role.",
        )

    return profile


async def get_current_user(request: Request) -> CurrentUser:
    token = _get_bearer_token(request)
    claims = _verify_supabase_jwt(token)
    user_id = claims.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is missing a user id.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    profile = await asyncio.to_thread(_fetch_user_profile, token, user_id)

    return CurrentUser(
        id=user_id,
        email=profile.get("email") or claims.get("email"),
        role=profile["role"],
        token=token,
    )


def require_roles(*allowed_roles: AppRole) -> Callable:
    async def dependency(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency
