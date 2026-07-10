import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import SearchBar from "../components/SearchBar";
import WatchlistCard from "../components/WatchlistCard";
import Disclaimer from "../components/Disclaimer";

const QUICK_ACCESS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "TSLA", name: "Tesla, Inc." },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com, Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "META", name: "Meta Platforms, Inc." },
];

function Stat({ value, label }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-white">{value}</span>{" "}
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

function StatDivider() {
  return <div className="h-4 w-px bg-white/10" />;
}

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadWatchlist = async () => {
    setLoadingWatchlist(true);
    try {
      const res = await client.get("/watchlist");
      setWatchlist(res.data);
      setError(null);
    } catch (err) {
      setError("Could not load watchlist. Is the backend running?");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleSearch = async (ticker) => {
    setSearching(true);
    setError(null);
    try {
      await client.get(`/search/${ticker}`);
      await client.post(`/watchlist/${ticker}`);
      navigate(`/stock/${ticker}`);
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to fetch stock data. Check the ticker and try again.";
      setError(detail);
    } finally {
      setSearching(false);
    }
  };

  const handleRemove = async (ticker) => {
    try {
      await client.delete(`/watchlist/${ticker}`);
      setWatchlist((prev) => prev.filter((s) => s.ticker !== ticker));
    } catch (err) {
      setError("Could not remove stock from watchlist.");
    }
  };

  const handleClearWatchlist = async () => {
    try {
      await client.delete("/watchlist");
      setWatchlist([]);
    } catch (err) {
      setError("Could not clear watchlist.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.04] bg-[#0F1117]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              ⚡
            </div>
            <span className="ml-2.5 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-xl font-bold text-transparent">
              StockAI
            </span>
            <span className="mx-3 hidden h-6 w-px bg-white/10 sm:inline-block" />
            <span className="hidden text-sm font-medium uppercase tracking-wider text-slate-500 sm:inline">
              Research Terminal
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-24">
        <div className="pointer-events-none absolute -left-24 -top-48 h-[500px] w-[500px] animate-pulse-ring rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-[120px]" />
        <div
          className="pointer-events-none absolute -top-24 right-0 h-[400px] w-[400px] animate-pulse-ring rounded-full bg-gradient-to-r from-purple-600/15 to-pink-600/15 blur-[100px]"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <span className="fade-in-1 mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
            AI-Powered Research
          </span>

          <h1 className="fade-in-2 text-5xl font-bold leading-tight text-white">
            Smarter Stock Research
            <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>

          <p className="fade-in-3 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Real-time market data, sentiment analysis, and AI-generated research reports. All in
            one place, completely free.
          </p>

          <div className="fade-in-4 relative mx-auto mt-10 max-w-2xl">
            <SearchBar onSearch={handleSearch} loading={searching} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-2 self-center text-xs uppercase tracking-wider text-slate-500">
              Popular:
            </span>
            {QUICK_ACCESS.map(({ ticker, name }) => (
              <button
                key={ticker}
                title={name}
                onClick={() => handleSearch(ticker)}
                disabled={searching}
                className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.05] px-4 py-1.5 text-sm text-slate-300 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ticker}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-left text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-4 px-4 sm:gap-6">
        <Stat value="220+" label="Stocks" />
        <StatDivider />
        <Stat value="Real-Time" label="Data" />
        <StatDivider />
        <Stat value="AI" label="Analysis" />
        <StatDivider />
        <Stat value="100%" label="Free" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-8 pt-10 sm:pb-10">
        <section className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-white">Your Portfolio</h2>
              {watchlist.length > 0 && (
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                  {watchlist.length}
                </span>
              )}
            </div>
            {watchlist.length >= 3 && (
              <button
                onClick={handleClearWatchlist}
                className="text-xs text-slate-500 transition-colors hover:text-red-400"
              >
                Clear All
              </button>
            )}
          </div>

          {loadingWatchlist && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 overflow-hidden rounded-2xl bg-surface-secondary">
                  <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {!loadingWatchlist && watchlist.length === 0 && (
            <div className="glass flex flex-col items-center gap-3 rounded-2xl py-16 text-center">
              <span className="text-4xl">📊</span>
              <p className="text-lg font-medium text-white">Start Building Your Portfolio</p>
              <p className="text-sm text-slate-400">Search for any stock above to add it here</p>
              <span className="mt-2 animate-float text-2xl text-slate-600">↑</span>
            </div>
          )}

          {!loadingWatchlist && watchlist.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchlist.map((stock) => (
                <WatchlistCard key={stock.ticker} stock={stock} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </section>

        <Disclaimer />
      </div>
    </div>
  );
}
