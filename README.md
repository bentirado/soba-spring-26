# SoBA Volunteer Analytics App

Volunteer management and analytics platform for Science Museum Oklahoma. The app has a React/Vite frontend, a FastAPI backend, and a PostgreSQL database.

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
```

Adjust it in `backend/.env` if your local Postgres user or password is different.

`OPENAI_API_KEY`, `GMAIL_ADDRESS`, and `GMAIL_APP_PASSWORD` are optional for local dashboard testing. Without them, the backend still starts, but chatbot and AI email sending endpoints return configuration errors when used.

Frontend authentication uses Supabase. Add the staging or production Supabase project values to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use only the Supabase publishable/anon key in frontend env vars. Never put a service role or secret key in the frontend.

The app expects a Supabase `public.user_profiles` table linked to `auth.users` with a `role` column. Supported application roles are `admin`, `staff`, and `viewer`. New users should default to `viewer`; promote staff/admin users from the Supabase SQL editor or dashboard during staging.

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

## Seed Demo Data

After the backend has created the database tables, seed local demo data:

```bash
cd backend
source .venv/bin/activate
python -m database.seed
```

Do not run the seed script against production unless you intentionally want demo data.

## Active Frontend Entry

The active frontend entrypoint is `frontend/src/main.tsx`, which loads `frontend/src/app/App.tsx`.
