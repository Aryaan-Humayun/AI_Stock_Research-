import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import SearchBar from "../components/SearchBar";
import WatchlistCard from "../components/WatchlistCard";

const QUICK_ACCESS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "TSLA", name: "Tesla, Inc." },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com, Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "META", name: "Meta Platforms, Inc." },
];

const NAV_LINKS = [
  { label: "Dashboard", active: true },
  { label: "Markets", active: false },
  { label: "Research", active: false },
];

const FEATURES = [
  {
    icon: "📊",
    title: "Live Market Data",
    description:
      "90 days of price history, fundamentals, and breaking news pulled in real-time from Yahoo Finance.",
  },
  {
    icon: "🧠",
    title: "AI Sentiment Analysis",
    description:
      "Every news headline classified as bullish, bearish, or neutral using advanced language models.",
  },
  {
    icon: "📈",
    title: "Research Reports",
    description:
      "One click AI analysis with risk scoring, opportunities, concerns, and investment summaries.",
  },
];

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const searchBarRef = useRef(null);
  const portfolioRef = useRef(null);

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

  const focusSearch = () => {
    searchBarRef.current?.focus();
  };

  const scrollToPortfolio = () => {
    portfolioRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.06] bg-[#0B0D14]">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
              S
            </div>
            <span className="ml-2 text-xl font-semibold text-white">StockAI</span>
            <nav className="ml-10 hidden items-center gap-8 sm:flex">
              {NAV_LINKS.map((link) => (
                <span
                  key={link.label}
                  className={
                    link.active
                      ? "text-sm text-white"
                      : "cursor-default text-sm text-slate-400 transition-colors hover:text-white"
                  }
                >
                  {link.label}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1 text-xs text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live Data
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-32 text-center">
        <p className="fade-in-1 mb-8 text-xs uppercase tracking-wide text-slate-500">
          Trusted by data-driven investors
        </p>

        <h1 className="fade-in-2 text-5xl font-bold tracking-tight text-white md:text-6xl">
          Stock research that
          <br />
          <span className="text-blue-400">thinks for itself.</span>
        </h1>

        <p className="fade-in-3 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          StockAI pulls live market data, runs sentiment analysis on breaking news, computes
          technical indicators, and generates AI research reports in seconds. No subscriptions, no
          fees.
        </p>

        <div className="fade-in-4 mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={focusSearch}
            className="rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-400 active:scale-95"
          >
            Start Researching →
          </button>
          <button
            onClick={scrollToPortfolio}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-8 py-3.5 text-base font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            See How It Works
          </button>
        </div>

        <div className="fade-in-4 mt-12 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
          <span>Free Forever</span>
          <span className="text-slate-600">·</span>
          <span>Real-Time Data</span>
          <span className="text-slate-600">·</span>
          <span>AI-Powered</span>
          <span className="text-slate-600">·</span>
          <span>220+ Stocks</span>
        </div>
      </section>

      <section className="mx-auto mt-4 w-full max-w-3xl px-6">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12141D] p-8">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Search</p>
          <SearchBar ref={searchBarRef} onSearch={handleSearch} loading={searching} />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-slate-500">Popular:</span>
            {QUICK_ACCESS.map(({ ticker, name }) => (
              <button
                key={ticker}
                title={name}
                onClick={() => handleSearch(ticker)}
                disabled={searching}
                className="rounded-full border border-white/[0.06] bg-transparent px-3 py-1 text-xs text-slate-400 transition-all hover:border-blue-500/30 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ticker}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-left text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/[0.06] bg-[#12141D] p-6 transition-all hover:border-white/[0.1]"
          >
            <span className="text-2xl">{feature.icon}</span>
            <h3 className="mt-3 text-base font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
          </div>
        ))}
      </section>

      <div
        ref={portfolioRef}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-8 pt-16"
      >
        <section className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-white">Your Portfolio</h2>
              {watchlist.length > 0 && (
                <span className="ml-3 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-slate-400">
                  {watchlist.length}
                </span>
              )}
            </div>
            {watchlist.length >= 3 && (
              <button
                onClick={handleClearWatchlist}
                className="text-sm text-slate-500 transition-colors hover:text-red-400"
              >
                Clear All
              </button>
            )}
          </div>

          {loadingWatchlist && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 overflow-hidden rounded-2xl bg-[#12141D]">
                  <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {!loadingWatchlist && watchlist.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#12141D] py-20 text-center">
              <span className="text-4xl">📊</span>
              <p className="mt-4 text-lg font-medium text-white">No stocks yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Search for a company above to start building your portfolio
              </p>
              <button
                onClick={focusSearch}
                className="mt-4 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                Add Your First Stock →
              </button>
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
      </div>

      <footer className="mt-20 border-t border-white/[0.04] px-6 pb-8 pt-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-sm text-slate-500">StockAI</span>
          <span className="text-xs text-slate-600">Educational purposes only. Not financial advice.</span>
          <span className="text-xs text-slate-600">Built with FastAPI, React &amp; AI</span>
        </div>
      </footer>
    </div>
  );
}
