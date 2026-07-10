import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const SENTIMENT_COLORS = {
  bullish: "#0ca30c",
  bearish: "#d03b3b",
  neutral: "#898781",
};

const SENTIMENT_LABELS = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

export default function WatchlistCard({ stock, onRemove }) {
  const navigate = useNavigate();
  const dotColor = SENTIMENT_COLORS[stock.sentiment] || SENTIMENT_COLORS.neutral;
  const sentimentLabel = SENTIMENT_LABELS[stock.sentiment] || "Neutral";
  const change = stock.daily_change_pct;
  const isPositive = change != null && change >= 0;
  const sparklineData = (stock.sparkline || []).map((v, i) => ({ i, v }));
  const sparklineColor = isPositive ? "#0ca30c" : "#d03b3b";

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.(stock.ticker);
  };

  return (
    <div
      onClick={() => navigate(`/stock/${stock.ticker}`)}
      className="group relative flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border border-gray-700 bg-gray-800 p-4 text-left transition duration-200 hover:scale-[1.02] hover:border-blue-500 hover:bg-gray-750"
    >
      <button
        onClick={handleRemoveClick}
        title="Remove from watchlist"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none text-gray-500 opacity-0 transition hover:bg-gray-700 hover:text-red-400 group-hover:opacity-100"
      >
        &times;
      </button>

      <div className="w-full pr-6">
        <p className="text-lg font-bold text-gray-100">{stock.ticker}</p>
        <p className="truncate text-xs text-gray-400" style={{ maxWidth: "12rem" }}>
          {stock.name}
        </p>
        {stock.sector && <p className="mt-0.5 text-xs text-gray-600">{stock.sector}</p>}
      </div>

      {sparklineData.length > 1 && (
        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparklineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex w-full items-end justify-between">
        <p className="text-xl font-semibold text-gray-100">
          {stock.latest_price != null ? `$${stock.latest_price.toFixed(2)}` : "—"}
        </p>
        {change != null && (
          <p className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="text-xs font-medium" style={{ color: dotColor }}>
          {sentimentLabel}
        </span>
      </div>
    </div>
  );
}
