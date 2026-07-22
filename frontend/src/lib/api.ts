import { supabase } from "./supabase";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
}

export async function getApiErrorMessage(
  response: Response,
  fallback = "Request failed.",
) {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // The backend may return an empty or non-JSON response for some failures.
  }

  return fallback;
}

export async function requireOk(response: Response, fallback?: string) {
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, fallback));
  }

  return response;
}
