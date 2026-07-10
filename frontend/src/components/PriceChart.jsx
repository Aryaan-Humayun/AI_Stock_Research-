import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SERIES_COLOR = "#60A5FA";
const GRID_COLOR = "rgba(255,255,255,0.05)";
const AXIS_COLOR = "#64748B";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const change = point.change;
  const isPositive = change != null && change >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-surface-secondary/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-xs text-text-muted">{formatDate(label)}</p>
      <p className="mt-0.5 text-base font-bold text-white">${payload[0].value.toFixed(2)}</p>
      {change != null && (
        <p className={`text-xs font-semibold ${isPositive ? "text-accent-green" : "text-accent-red"}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </p>
      )}
    </div>
  );
}

export default function PriceChart({ prices }) {
  if (!prices || prices.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-white/5 bg-surface-secondary text-text-muted">
        No price data available
      </div>
    );
  }

  const data = prices.map((p, idx) => {
    const prevClose = idx > 0 ? prices[idx - 1].close : null;
    const change = prevClose ? ((p.close - prevClose) / prevClose) * 100 : null;
    return { date: p.date, close: p.close, change };
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-secondary p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-secondary">Price — Last 90 Days</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={55}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill="url(#priceGradient)"
            activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#0F1117", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
