function ChangeBadge({ value }) {
  if (value == null) return <span className="text-gray-500">—</span>;
  const isPositive = value >= 0;
  return (
    <span className={isPositive ? "text-green-400" : "text-red-400"}>
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function rsiLabel(rsi) {
  if (rsi == null) return null;
  if (rsi >= 70) return { text: "Overbought", color: "text-red-400" };
  if (rsi <= 30) return { text: "Oversold", color: "text-green-400" };
  return { text: "Neutral", color: "text-gray-400" };
}

export default function TechnicalIndicators({ technicals }) {
  if (!technicals) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-gray-500">
        No technical data available.
      </div>
    );
  }

  const rsiInfo = rsiLabel(technicals.rsi_14);
  const macd = technicals.macd;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">Technical Indicators</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">SMA 20</p>
          <p className="mt-1 text-base font-semibold text-gray-100">
            {technicals.sma_20 != null ? `$${technicals.sma_20.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">SMA 50</p>
          <p className="mt-1 text-base font-semibold text-gray-100">
            {technicals.sma_50 != null ? `$${technicals.sma_50.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">RSI (14)</p>
          <p className="mt-1 text-base font-semibold text-gray-100">
            {technicals.rsi_14 != null ? technicals.rsi_14.toFixed(1) : "—"}{" "}
            {rsiInfo && <span className={`text-xs font-normal ${rsiInfo.color}`}>({rsiInfo.text})</span>}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">MACD</p>
          <p className="mt-1 text-base font-semibold text-gray-100">
            {macd ? macd.macd_line.toFixed(2) : "—"}
          </p>
          {macd && <p className="text-xs text-gray-500">Signal: {macd.signal_line.toFixed(2)}</p>}
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">Daily Change</p>
          <p className="mt-1 text-base font-semibold">
            <ChangeBadge value={technicals.daily_change_pct} />
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs text-gray-500">30-Day Change</p>
          <p className="mt-1 text-base font-semibold">
            <ChangeBadge value={technicals.thirty_day_change_pct} />
          </p>
        </div>
      </div>
    </div>
  );
}
