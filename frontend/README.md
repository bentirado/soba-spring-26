# Frontend — local dev & routes

This small README documents how to run the frontend locally and the routes / theme variables I added.

## Run locally

From the project root or from the `frontend` folder:

```bash
cd frontend
npm install   # (only required if you haven't installed already)
npm run dev
```

Vite will print the local dev URL (usually `http://localhost:5173`) — open that in your browser.

## Routes

The app uses `react-router-dom` (v6). Placeholder routes created for navigation testing:

- `/` — Dashboard
- `/volunteers` — Volunteers
- `/programs` — Programs
- `/events` — Events
- `/analytics` — Analytics
- `/settings` — Settings
- `*` — NotFound

These pages live in `src/pages/*.tsx` and are intentionally minimal so we can wire them to data next.

## Color variables (single source of truth)

Edit `src/index.css` to change the theme. Key CSS variables defined in `:root`:

## Science Museum palette applied

I applied the Science Museum of Oklahoma palette you provided. The key variables are:

- Light mode (default):
	- `--primary`: #1e5eb8
	- `--secondary`: #ff7b3f
	- `--accent-green`: #2ea86f
	- `--bg`: #f8fafb
	- `--card-bg`: #ffffff
	- `--muted-bg`: #e8eff5
	- `--text`: oklch(0.145 0 0)
	- `--muted`: #5c6c7d

- Dark mode (prefers-color-scheme: dark):
	- `--primary`: #4a9dd9
	- `--secondary`: #ff9b6b
	- `--accent-green`: #4fc38a
	- `--bg`: #0a1929
	- `--card-bg`: #132f4c
	- `--text`: #e8e6f8

Charts use the `--chart-1..5` variables and borders use `--border` for subtle separation.

If you'd like the text token (`--text`) converted to a hex value for better editor support I can replace the `oklch(...)` value with an accessible hex equivalent.

## Notes

- Navbar, Layout, and a small `ui/Button` component are under `src/components`.
- Pages are under `src/pages` and are easy to swap with real UI/data.
- If you want, I can wire the Dashboard to backend mock data next.
