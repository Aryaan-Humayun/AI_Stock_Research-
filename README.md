# Stock Research Assistant

An AI-powered stock research platform that runs entirely locally at zero cost. It pulls
stock price data and news, computes technical indicators, and uses a local LLM (via
[Ollama](https://ollama.com)) to generate sentiment classification and full research reports.

No paid APIs, no API keys, no cloud costs — everything runs on your machine.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React, Vite, Tailwind CSS (dark theme), Recharts
- **LLM:** Local Ollama instance (`http://localhost:11434`)
- **Data:** `yfinance` (stock prices/fundamentals), `gnews` (news)

## Features

- Search any stock ticker to pull fresh price, fundamentals, and news data
- Watchlist with live sentiment indicators (bullish/bearish/neutral)
- 90-day interactive price chart
- Fundamentals grid (P/E, EPS, market cap, 52-week range, revenue, profit margin)
- Technical indicators (SMA 20/50, RSI 14, MACD, daily & 30-day % change)
- News feed color-coded by AI-classified sentiment
- Full AI-generated research report: company overview, trend analysis, risk score (1-10),
  opportunities, concerns, and an investment summary

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running locally, with a model pulled, e.g.:

  ```bash
  ollama pull qwen3:4b
  ollama serve
  ```

## Setup

### 1. Backend

```bash
cd stock-research-assistant
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # adjust OLLAMA_MODEL / OLLAMA_URL if needed

cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).
The SQLite database is created automatically at `data/stocks.db` on first run.

### 2. Frontend

In a separate terminal:

```bash
cd stock-research-assistant/frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Usage

1. Make sure Ollama is running (`ollama serve`) with your chosen model pulled.
2. Start the backend (port 8000) and frontend (port 5173) as above.
3. Open `http://localhost:5173`, search for a ticker (e.g. `AAPL`), and it will be added
   to your watchlist automatically.
4. Click into a stock to view its chart, fundamentals, technicals, and news.
5. Click "Generate Analysis" to run the full AI research pipeline. This can take
   30-60 seconds depending on your machine and model — a loading indicator will show
   while Ollama is working.

## Project Structure

```
stock-research-assistant/
├── backend/
│   ├── main.py            # FastAPI app entry point
│   ├── config.py          # Env-driven configuration
│   ├── database.py        # SQLAlchemy engine/session/init_db
│   ├── models/            # SQLAlchemy ORM models
│   ├── services/           # Data fetching, LLM, sentiment, technicals, analysis
│   └── routes/             # API route handlers
├── frontend/
│   └── src/
│       ├── api/            # Axios client
│       ├── pages/          # Dashboard, StockDetail
│       └── components/     # Reusable UI components
├── data/                   # SQLite database (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```

## Configuration

Environment variables (see `.env.example`):

| Variable       | Default                   | Description                          |
|----------------|---------------------------|---------------------------------------|
| `OLLAMA_MODEL` | `qwen3:4b`                | Ollama model used for all LLM calls   |
| `OLLAMA_URL`   | `http://localhost:11434`  | Ollama server URL                     |
| `DB_PATH`      | `data/stocks.db`          | SQLite database path (relative to repo root) |

All LLM calls are routed through `backend/services/llm_service.py`, so the model can be
swapped at any time by changing `OLLAMA_MODEL` — no code changes required.

## Disclaimer

This tool is for educational purposes only. Not financial advice.
