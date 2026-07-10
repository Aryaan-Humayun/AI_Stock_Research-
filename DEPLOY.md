# Deploying Stock Research Assistant

This guide deploys the backend (FastAPI) to **Render** and the frontend
(React/Vite) to **Vercel**.

Since Render's servers can't reach a local Ollama instance running on your
machine, the deployed backend must use **OpenRouter** as its LLM provider —
this is already the default in `render.yaml`. Local development can still use
Ollama as before; only the deployed backend is affected.

## 1. Push code to GitHub

```bash
git add .
git commit -m "Add deployment config for Render + Vercel"
git push origin main
```

Make sure `.env` is **not** committed — it's already in `.gitignore`. Only
`.env.example` should be tracked.

## 2. Backend — deploy to Render

1. Go to [render.com](https://render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select this repository.
4. Render should detect `render.yaml` and offer to use it as a Blueprint —
   accept it. If it doesn't auto-detect, configure manually:
   - **Runtime**: Docker
   - **Dockerfile path**: `./Dockerfile`
   - **Plan**: Free
5. Under **Environment**, set these variables (some are pre-filled by
   `render.yaml`, but the two marked "manual" below only exist as empty
   placeholders in the file and must be filled in yourself in the dashboard —
   they're intentionally excluded from the committed file):
   - `LLM_PROVIDER=openrouter` (pre-filled)
   - `OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free` (pre-filled)
   - `OPENROUTER_FAST_MODEL=nvidia/nemotron-3-nano-30b-a3b:free` (pre-filled)
   - `OPENROUTER_API_KEY=<your key>` (**manual** — get one at
     [openrouter.ai/keys](https://openrouter.ai/keys))
   - `FRONTEND_ORIGIN=<your Vercel URL>` (**manual** — you won't know this
     until step 3 is done; see the note at the end of this guide)
6. Click **Deploy**. First build takes a few minutes.
7. Once live, note your backend URL — something like
   `https://stock-research-api.onrender.com`.
8. Sanity check: visit `https://stock-research-api.onrender.com/api/health`
   and confirm you get back `{"status":"ok", ...}`.

**Free tier note:** Render's free web services spin down after 15 minutes of
inactivity and take ~30-60 seconds to cold-start on the next request — the
first request after idle time will be slow. The filesystem is also
ephemeral, so the SQLite database (watchlist, cached prices/news) resets on
every redeploy or restart. This is fine for a demo; for persistence you'd
need Render's paid disk add-on or an external database.

## 3. Frontend — deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New...** → **Project** → import this GitHub repo.
3. When configuring the project:
   - **Root Directory**: `frontend`
   - Vercel should auto-detect the Vite framework preset.
4. Under **Environment Variables**, add:
   - `VITE_API_URL=https://stock-research-api.onrender.com/api`
     (use your actual Render URL from step 2, keep the `/api` suffix)
5. Click **Deploy**.
6. Once live, note your Vercel URL — something like
   `https://stock-research-assistant.vercel.app`.

## 4. Close the loop: set FRONTEND_ORIGIN on Render

The backend's CORS policy only allows requests from origins it's explicitly
told about. Now that you have your real Vercel URL:

1. Go back to your Render service → **Environment**.
2. Set `FRONTEND_ORIGIN` to your Vercel URL from step 3 (e.g.
   `https://stock-research-assistant.vercel.app` — no trailing slash).
3. Save — Render will automatically redeploy with the new value.

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
means step 4 above wasn't completed; a network error/timeout means the Render
service may still be cold-starting.
