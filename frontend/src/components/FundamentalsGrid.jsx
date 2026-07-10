function formatNumber(value, opts = {}) {
  if (value == null) return "—";
  const { prefix = "", suffix = "", decimals = 2, compact = false } = opts;
  if (compact) {
    return `${prefix}${new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value)}${suffix}`;
  }
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

export default function FundamentalsGrid({ fundamentals }) {
  if (!fundamentals) {
    return (
      <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6 text-text-muted">
        No fundamental data available.
      </div>
    );
  }

  const items = [
    { label: "P/E Ratio", value: formatNumber(fundamentals.pe_ratio) },
    { label: "EPS", value: formatNumber(fundamentals.eps, { prefix: "$" }) },
    { label: "Market Cap", value: formatNumber(fundamentals.market_cap, { prefix: "$", compact: true }) },
    { label: "52-Week High", value: formatNumber(fundamentals.fifty_two_week_high, { prefix: "$" }) },
    { label: "52-Week Low", value: formatNumber(fundamentals.fifty_two_week_low, { prefix: "$" }) },
    { label: "Revenue", value: formatNumber(fundamentals.revenue, { prefix: "$", compact: true }) },
    {
      label: "Profit Margin",
      value:
        fundamentals.profit_margin != null
          ? `${(fundamentals.profit_margin * 100).toFixed(2)}%`
          : "—",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span>💰</span> Fundamentals
      </h3>
      <div className="grid grid-cols-2 gap-4">
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
