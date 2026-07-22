# SoBA Volunteer Analytics App

Internal volunteer management and analytics platform for Science Museum Oklahoma staff. The app has a React/Vite frontend, a FastAPI backend, and a PostgreSQL database.

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer recommended
- PostgreSQL running locally

The current code also runs on Python 3.9 after the compatibility updates in this repo.

## Environment Setup

Create local environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Default local backend database URL:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/soba_db
AUTO_CREATE_TABLES=true
```

Adjust it in `backend/.env` if your local Postgres user or password is different.

`OPENAI_API_KEY`, `GMAIL_ADDRESS`, and `GMAIL_APP_PASSWORD` are optional for local dashboard testing. Without them, the backend still starts, but chatbot and AI email sending endpoints return configuration errors when used.

Frontend authentication uses Supabase. Add the staging or production Supabase project values to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use only the Supabase publishable/anon key in frontend env vars. Never put a service role or secret key in the frontend.

The app is client-facing only and does not expose a public volunteer/customer application portal. It expects a Supabase `public.user_profiles` table linked to `auth.users` with a `role` column. Supported application roles are `admin`, `staff`, and `viewer`. New users should default to `viewer`; promote staff/admin users from the Supabase SQL editor or dashboard during staging.

Protected backend routes also need Supabase settings in `backend/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_JWT_SECRET=your-legacy-jwt-secret
```

The backend verifies Supabase access tokens locally. Projects using JWT Signing Keys, such as `ES256`, are verified through Supabase's public JWKS endpoint. `SUPABASE_JWT_SECRET` is only required for legacy `HS256` projects. Never place a service role key or JWT secret in `frontend/.env`.

## Run Locally

Install and start the backend:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

In a second terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at:

```text
http://127.0.0.1:5173
```

Backend health check:

```text
http://127.0.0.1:8000/health
```

## Database Migrations

The backend includes Alembic migrations for repeatable database schema changes.

For local development, `AUTO_CREATE_TABLES=true` keeps the old convenience behavior where missing tables are created on backend startup. For staging and production, set:

```env
AUTO_CREATE_TABLES=false
```

Then run migrations explicitly:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

Use the same command against production after setting `DATABASE_URL` to the production Supabase Postgres connection string. Supabase Auth tables are managed by Supabase; these migrations cover the FastAPI application's SQLAlchemy tables.

## Seed Demo Data

After the backend has created the database tables or migrations have run, seed local demo data:

```bash
cd backend
source .venv/bin/activate
python -m database.seed
```

The seed script is local/staging-only. Do not run it against production unless you intentionally want demo data.

## Active Frontend Entry

The active frontend entrypoint is `frontend/src/main.tsx`, which loads `frontend/src/app/App.tsx`.
