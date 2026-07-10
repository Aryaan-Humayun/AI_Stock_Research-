import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import PriceChart from "../components/PriceChart";
import FundamentalsGrid from "../components/FundamentalsGrid";
import TechnicalIndicators from "../components/TechnicalIndicators";
import NewsFeed from "../components/NewsFeed";
import AnalysisReport from "../components/AnalysisReport";
import Disclaimer from "../components/Disclaimer";

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-gray-800 ${className}`} />;
}

function StockDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
      <SkeletonBlock className="mb-6 h-4 w-32" />
      <SkeletonBlock className="mb-2 h-9 w-64" />
      <SkeletonBlock className="mb-6 h-5 w-40" />
      <div className="flex flex-col gap-6">
        <SkeletonBlock className="h-72 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-56 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function StockDetail() {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get(`/stock/${ticker}`);
      setData(res.data);
      setInWatchlist(res.data.stock.in_watchlist);
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to load stock data.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  const loadReport = useCallback(async () => {
    try {
      const res = await client.get(`/report/${ticker}`);
      setReport(res.data);
    } catch (err) {
      setReport(null);
    }
  }, [ticker]);

  useEffect(() => {
    loadStock();
    loadReport();
  }, [loadStock, loadReport]);

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await client.post(`/analyze/${ticker}`, null, { timeout: 300000 });
      setReport(res.data);
      await loadStock();
    } catch (err) {
      const detail = err.response?.data?.detail || "Analysis failed. Is Ollama running?";
      setError(detail);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await client.delete(`/watchlist/${ticker}`);
        setInWatchlist(false);
      } else {
        await client.post(`/watchlist/${ticker}`);
        setInWatchlist(true);
      }
    } catch (err) {
      setError("Could not update watchlist.");
    }
  };

  if (loading) {
    return <StockDetailSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="text-sm text-blue-400 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <div className="mt-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  const { stock, fundamentals, prices, news, technicals } = data;
  const latestPrice = prices.length > 0 ? prices[prices.length - 1].close : null;
  const dailyChange = technicals?.daily_change_pct;
  const isPositive = dailyChange != null && dailyChange >= 0;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-bold text-gray-100">{stock.ticker}</span>
          <div className="flex items-center gap-3">
            {latestPrice != null && (
              <span className="font-semibold text-gray-100">${latestPrice.toFixed(2)}</span>
            )}
            {dailyChange != null && (
              <span className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}
                {dailyChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <Link to="/" className="mb-6 text-sm text-blue-400 hover:underline">
          &larr; Back to Dashboard
        </Link>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              {stock.name} <span className="text-gray-500">({stock.ticker})</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">{stock.sector || "Unknown sector"}</p>
            {latestPrice != null && (
              <p className="mt-2 text-2xl font-semibold text-gray-100">${latestPrice.toFixed(2)}</p>
            )}
          </div>
          <button
            onClick={toggleWatchlist}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              inWatchlist
                ? "border-red-700 text-red-400 hover:bg-red-900/30"
                : "border-blue-600 text-blue-400 hover:bg-blue-900/30"
            }`}
          >
            {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <PriceChart prices={prices} />
          <FundamentalsGrid fundamentals={fundamentals} />
          <TechnicalIndicators technicals={technicals} />
          <NewsFeed news={news} />
          <AnalysisReport report={report} onGenerate={handleGenerateAnalysis} loading={analyzing} />
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
