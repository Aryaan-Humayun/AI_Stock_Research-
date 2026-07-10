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
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-white/[0.06] bg-[#12141D] p-5 text-left transition-all duration-200 hover:border-white/[0.1]"
    >
      <button
        onClick={handleRemoveClick}
        title="Remove from portfolio"
        className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none text-slate-500 opacity-0 transition-opacity duration-200 hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
      >
        &times;
      </button>

      <div className="pr-6">
        <p className="text-base font-bold text-white">{stock.ticker}</p>
        <p className="truncate text-sm text-slate-400" style={{ maxWidth: "12rem" }}>
          {stock.name}
        </p>
        {stock.sector && <p className="mt-0.5 text-xs text-slate-500">{stock.sector}</p>}
      </div>

      {sparklineData.length > 1 && (
        <div className="mt-3 h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={trendColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-auto flex items-end justify-between pt-3">
        <p className="text-xl font-bold text-white">
          {stock.latest_price != null ? `$${stock.latest_price.toFixed(2)}` : "—"}
        </p>
        {change != null && (
          <span className={`text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: sentimentColor }}>
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: sentimentColor }} />
        {sentimentLabel}
      </div>
    </div>
  );
}
