import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import SearchBar from "../components/SearchBar";
import WatchlistCard from "../components/WatchlistCard";
import Disclaimer from "../components/Disclaimer";

const QUICK_ACCESS_TICKERS = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN", "NVDA", "META"];

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
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl">
          Stock Research Assistant
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          AI-powered stock research, running entirely locally.
        </p>
      </header>

      <SearchBar onSearch={handleSearch} loading={searching} />

      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
        {QUICK_ACCESS_TICKERS.map((ticker) => (
          <button
            key={ticker}
            onClick={() => handleSearch(ticker)}
            disabled={searching}
            className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ticker}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="mt-10 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-200">Your Watchlist</h2>
          {watchlist.length >= 3 && (
            <button
              onClick={handleClearWatchlist}
              className="text-xs font-medium text-gray-500 transition hover:text-red-400"
            >
              Clear Watchlist
            </button>
          )}
        </div>

        {loadingWatchlist && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />
          </div>
        )}

        {!loadingWatchlist && watchlist.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/50 p-10 text-center text-gray-500">
            Your watchlist is empty. Search for a stock above to get started.
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
  );
}
