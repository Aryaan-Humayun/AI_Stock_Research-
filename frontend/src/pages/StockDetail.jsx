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
  return (
    <div className={`overflow-hidden rounded-2xl bg-surface-secondary ${className}`}>
      <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function StockDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
      <SkeletonBlock className="mb-6 h-4 w-32" />
      <SkeletonBlock className="mb-2 h-9 w-64" />
      <SkeletonBlock className="mb-6 h-5 w-40" />
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
          <SkeletonBlock className="h-80 lg:col-span-7" />
          <SkeletonBlock className="h-80 lg:col-span-3" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>
        <SkeletonBlock className="h-56 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}

function formatCompact(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function KeyStatsCard({ latestPrice, fundamentals }) {
  const items = [
    { label: "Price", value: latestPrice != null ? `$${latestPrice.toFixed(2)}` : "—" },
    { label: "Market Cap", value: fundamentals ? `$${formatCompact(fundamentals.market_cap)}` : "—" },
    { label: "P/E Ratio", value: fundamentals?.pe_ratio != null ? fundamentals.pe_ratio.toFixed(2) : "—" },
    {
      label: "52-Week Range",
      value:
        fundamentals?.fifty_two_week_low != null && fundamentals?.fifty_two_week_high != null
          ? `$${fundamentals.fifty_two_week_low.toFixed(0)} - $${fundamentals.fifty_two_week_high.toFixed(0)}`
          : "—",
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/5 bg-surface-secondary p-6">
      <h3 className="text-sm font-semibold text-text-secondary">Key Stats</h3>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-text-muted">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentSummaryCard({ news }) {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  (news || []).forEach((n) => {
    const label = n.sentiment_label || "neutral";
    if (counts[label] != null) counts[label] += 1;
  });
  const total = news?.length || 0;
  const rows = [
    { label: "Bullish", key: "bullish", color: "#10B981" },
    { label: "Neutral", key: "neutral", color: "#F59E0B" },
    { label: "Bearish", key: "bearish", color: "#EF4444" },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span>🧭</span> Sentiment Summary
      </h3>
      {total === 0 ? (
        <p className="text-sm text-text-muted">No news to summarize yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const pct = total > 0 ? (counts[row.key] / total) * 100 : 0;
            return (
              <div key={row.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="text-text-muted">{counts[row.key]}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BackArrow() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
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
      const detail = err.response?.data?.detail || "The AI model may be temporarily unavailable. Try again in a minute.";
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
        <Link to="/" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-white">
          <BackArrow /> Back
        </Link>
        <div className="mt-4 rounded-xl border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-red-300">
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
      <div className="sticky top-0 z-10 border-b border-white/5 bg-surface-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{stock.ticker}</span>
            <span className="hidden text-sm text-text-muted sm:inline">{stock.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {latestPrice != null && (
              <span className="font-semibold text-white">${latestPrice.toFixed(2)}</span>
            )}
            {dailyChange != null && (
              <span
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isPositive ? "bg-accent-green/15 text-accent-green" : "bg-accent-red/15 text-accent-red"
                }`}
              >
                {isPositive ? "▲" : "▼"} {Math.abs(dailyChange).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <Link to="/" className="mb-6 flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-white">
          <BackArrow /> Back
        </Link>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {stock.name} <span className="text-text-muted">({stock.ticker})</span>
            </h1>
            <p className="mt-1 text-sm text-text-secondary">{stock.sector || "Unknown sector"}</p>
          </div>
          <button
            onClick={toggleWatchlist}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
              inWatchlist
                ? "border-accent-red/30 text-accent-red hover:bg-accent-red/10"
                : "border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10"
            }`}
          >
            {inWatchlist ? "Remove from Portfolio" : "Add to Portfolio"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
            <div className="lg:col-span-7">
              <PriceChart prices={prices} />
            </div>
            <div className="lg:col-span-3">
              <KeyStatsCard latestPrice={latestPrice} fundamentals={fundamentals} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <FundamentalsGrid fundamentals={fundamentals} />
            <TechnicalIndicators technicals={technicals} currentPrice={latestPrice} />
            <SentimentSummaryCard news={news} />
          </div>

          <NewsFeed news={news} />
          <AnalysisReport report={report} onGenerate={handleGenerateAnalysis} loading={analyzing} ticker={stock.ticker} />
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
