import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SERIES_COLOR = "#3987e5";
const GRID_COLOR = "#2c2c2a";
const AXIS_COLOR = "#898781";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-400">{formatDate(label)}</p>
      <p className="text-sm font-semibold text-gray-100">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function PriceChart({ prices }) {
  if (!prices || prices.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-500">
        No price data available
      </div>
    );
  }

  const data = prices.map((p) => ({ date: p.date, close: p.close }));

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">
        Price — Last 90 Days
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SERIES_COLOR} stopOpacity={0.4} />
              <stop offset="95%" stopColor={SERIES_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
