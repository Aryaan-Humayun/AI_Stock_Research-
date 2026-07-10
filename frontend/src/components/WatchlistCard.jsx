import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const SENTIMENT_COLORS = {
  bullish: "#10B981",
  bearish: "#EF4444",
  neutral: "#F59E0B",
};

const SENTIMENT_LABELS = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

export default function WatchlistCard({ stock, onRemove }) {
  const navigate = useNavigate();
  const sentimentColor = SENTIMENT_COLORS[stock.sentiment] || SENTIMENT_COLORS.neutral;
  const sentimentLabel = SENTIMENT_LABELS[stock.sentiment] || "Neutral";
  const change = stock.daily_change_pct;
  const isPositive = change != null && change >= 0;
  const sparklineData = (stock.sparkline || []).map((v, i) => ({ i, v }));
  const trendColor = isPositive ? "#10B981" : "#EF4444";
  const gradientId = `sparkline-gradient-${stock.ticker}`;

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.(stock.ticker);
  };

  return (
    <div
      onClick={() => navigate(`/stock/${stock.ticker}`)}
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.04] bg-[#1A1D28]/80 text-left transition-all duration-300 hover:border-white/[0.08] hover:glow-blue"
      style={{ borderLeft: `3px solid ${sentimentColor}` }}
    >
      <button
        onClick={handleRemoveClick}
        title="Remove from portfolio"
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none text-text-muted opacity-0 transition-opacity duration-200 hover:bg-white/10 hover:text-accent-red group-hover:opacity-100"
      >
        &times;
      </button>

      <div className="flex flex-col gap-3 p-4 pb-3">
        <div className="pr-6">
          <p className="text-lg font-bold text-white">{stock.ticker}</p>
          <p className="truncate text-sm text-slate-400" style={{ maxWidth: "12rem" }}>
            {stock.name}
          </p>
          {stock.sector && (
            <span className="mt-1 inline-block rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-slate-500">
              {stock.sector}
            </span>
          )}
        </div>

        {sparklineData.length > 1 && (
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={trendColor}
                  strokeWidth={1.75}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex w-full items-end justify-between">
          <p className="text-2xl font-bold text-white">
            {stock.latest_price != null ? `$${stock.latest_price.toFixed(2)}` : "—"}
          </p>
          {change != null && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
            </span>
          )}
        </div>

        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: sentimentColor }}>
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: sentimentColor }} />
          {sentimentLabel}
        </span>
      </div>

      <div className="h-[3px] w-full" style={{ backgroundColor: sentimentColor }} />
    </div>
  );
}
