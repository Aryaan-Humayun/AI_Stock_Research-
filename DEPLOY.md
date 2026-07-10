# Deploying Stock Research Assistant

The backend (FastAPI) is deployed as a Docker container to **Back4App**, and
the frontend (React/Vite) deploys to **Vercel**.

**Live backend:** `https://rajaaryaanhumayunsarfraz-6e17wizr.b4a.run`

Since the hosted backend can't reach a local Ollama instance running on your
machine, it runs with **OpenRouter** as its LLM provider instead. Local
development can still use Ollama as before; only the deployed backend is
affected.

> A `render.yaml` is also kept in this repo as an alternative path if you
> ever want to deploy the same Dockerfile to Render instead — see the
> "Alternative: Render" section at the bottom. It's not currently used.

## 1. Push code to GitHub

```bash
git add .
git commit -m "your message"
git push origin main
```

Make sure `.env` is **not** committed — it's already in `.gitignore`. Only
`.env.example` should be tracked.

## 2. Backend — deploy to Back4App

1. Go to [back4app.com](https://back4app.com) and sign in.
2. Create a new **Container** app (Back4App's Docker/Containers-as-a-Service
   product) and connect your GitHub repo.
3. Point it at the repo root, where `Dockerfile` lives — it builds and runs
   the image directly, same as any standard Docker deployment (installs
   `requirements.txt`, copies `backend/` and `data/` in flat, runs
   `uvicorn main:app --host 0.0.0.0 --port 8000`).
4. In the app's environment variable settings, set:
   - `LLM_PROVIDER=openrouter`
   - `OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free`
   - `OPENROUTER_FAST_MODEL=nvidia/nemotron-3-nano-30b-a3b:free`
   - `OPENROUTER_API_KEY=<your key>` — get one at
     [openrouter.ai/keys](https://openrouter.ai/keys)
   - `FRONTEND_ORIGIN=<your Vercel URL>` (you won't know this until step 3 is
     done — come back and set it; see step 4 below)
5. Deploy. Back4App assigns a public URL on the `.b4a.run` domain.
6. Sanity check:
   `curl https://rajaaryaanhumayunsarfraz-6e17wizr.b4a.run/api/health`
   should return `{"status":"ok", "database_connected":true, ...}`.

**Note on persistence:** container filesystems on most free-tier container
hosts (Back4App included) are typically ephemeral — the SQLite database
(watchlist, cached prices/news) may reset on redeploy or restart. Fine for a
demo; for durable storage you'd want an external database.

## 3. Frontend — deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New...** → **Project** → import this GitHub repo.
3. When configuring the project:
   - **Root Directory**: `frontend`
   - Vercel should auto-detect the Vite framework preset.
4. Under **Environment Variables**, add:
   - `VITE_API_URL=https://rajaaryaanhumayunsarfraz-6e17wizr.b4a.run/api`
     (keep the `/api` suffix)
5. Click **Deploy**.
6. Once live, note your Vercel URL — something like
   `https://stock-research-assistant.vercel.app`.

## 4. Close the loop: set FRONTEND_ORIGIN on Back4App

The backend's CORS policy only allows requests from origins it's explicitly
told about. Now that you have your real Vercel URL:

1. Go back to your Back4App container app's environment variables.
2. Set `FRONTEND_ORIGIN` to your Vercel URL from step 3 (e.g.
   `https://stock-research-assistant.vercel.app` — no trailing slash).
3. Save/redeploy so the new value takes effect.

Skipping this step means the deployed frontend's API calls will fail with
CORS errors in the browser console, even though both services are individually
up and healthy.

## 5. Test the full deployment

1. Visit your Vercel URL.
2. Search for a stock (e.g. `AAPL`).
3. Open its detail page and confirm price chart, fundamentals, technicals,
   and news all load.
4. Click **Generate Analysis** and confirm a report comes back (OpenRouter's
   free tier can be slow or rate-limited — see the app's own error messages
   if it fails, and retry after a short wait).

If step 2 or 3 fails, open the browser devtools console first — a CORS error
means step 4 above wasn't completed; a network error/timeout means the
backend may still be cold-starting.

## Alternative: Render

This repo also includes a `render.yaml` Blueprint for deploying the same
Dockerfile to [Render](https://render.com) instead of Back4App, if you ever
want to switch or run a second environment. It's configured with the same
`nvidia/nemotron-3-nano-30b-a3b:free` model; `OPENROUTER_API_KEY` and
`FRONTEND_ORIGIN` are marked `sync: false` so they must be entered manually in
Render's dashboard rather than committed to the file. The steps mirror
sections 2 and 4 above, just in Render's UI (New Web Service → connect repo →
it should auto-detect `render.yaml`).
