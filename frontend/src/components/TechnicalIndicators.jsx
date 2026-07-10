function ChangeBadge({ value }) {
  if (value == null) return <span className="text-text-muted">—</span>;
  const isPositive = value >= 0;
  return (
    <span className={isPositive ? "text-accent-green" : "text-accent-red"}>
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function rsiLabel(rsi) {
  if (rsi == null) return null;
  if (rsi >= 70) return { text: "Overbought", color: "text-accent-red" };
  if (rsi <= 30) return { text: "Oversold", color: "text-accent-green" };
  return { text: "Neutral", color: "text-text-secondary" };
}

function RSIGauge({ rsi }) {
  if (rsi == null) return null;
  const pct = Math.min(100, Math.max(0, rsi));
  return (
    <div className="mt-2">
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full"
        style={{
          background:
            "linear-gradient(to right, #10B981 0%, #10B981 30%, #F59E0B 30%, #F59E0B 70%, #EF4444 70%, #EF4444 100%)",
        }}
      >
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-surface-secondary bg-white shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SmaArrow({ sma, currentPrice }) {
  if (sma == null || currentPrice == null) return null;
  const above = currentPrice > sma;
  return (
    <span className={`ml-1 text-xs ${above ? "text-accent-green" : "text-accent-red"}`}>
      {above ? "↑" : "↓"}
    </span>
  );
}

function MacdBar({ histogram }) {
  if (histogram == null) return null;
  const isPositive = histogram >= 0;
  const widthPct = Math.min(50, Math.abs(histogram) * 15);
  return (
    <div className="relative mt-2 h-3 w-full">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
      <div
        className={`absolute top-0 h-full rounded-sm ${isPositive ? "bg-accent-green" : "bg-accent-red"}`}
        style={isPositive ? { left: "50%", width: `${widthPct}%` } : { right: "50%", width: `${widthPct}%` }}
      />
    </div>
  );
}

export default function TechnicalIndicators({ technicals, currentPrice }) {
  if (!technicals) {
    return (
      <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6 text-text-muted">
        No technical data available.
      </div>
    );
  }

  const rsiInfo = rsiLabel(technicals.rsi_14);
  const macd = technicals.macd;

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span>📐</span> Technical Indicators
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-muted">SMA 20</p>
          <p className="mt-1 text-lg font-bold text-white">
            {technicals.sma_20 != null ? `$${technicals.sma_20.toFixed(2)}` : "—"}
            <SmaArrow sma={technicals.sma_20} currentPrice={currentPrice} />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">SMA 50</p>
          <p className="mt-1 text-lg font-bold text-white">
            {technicals.sma_50 != null ? `$${technicals.sma_50.toFixed(2)}` : "—"}
            <SmaArrow sma={technicals.sma_50} currentPrice={currentPrice} />
          </p>
        </div>
        <div className="col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-text-muted">RSI (14)</p>
            {rsiInfo && <span className={`text-xs font-medium ${rsiInfo.color}`}>{rsiInfo.text}</span>}
          </div>
          <p className="mt-1 text-lg font-bold text-white">
            {technicals.rsi_14 != null ? technicals.rsi_14.toFixed(1) : "—"}
          </p>
          <RSIGauge rsi={technicals.rsi_14} />
        </div>
        <div className="col-span-2">
          <p className="text-xs text-text-muted">MACD Histogram</p>
          <p className="mt-1 text-lg font-bold text-white">{macd ? macd.macd_line.toFixed(2) : "—"}</p>
          {macd && <p className="text-xs text-text-muted">Signal: {macd.signal_line.toFixed(2)}</p>}
          {macd && <MacdBar histogram={macd.histogram} />}
        </div>
        <div>
          <p className="text-xs text-text-muted">Daily Change</p>
          <p className="mt-1 text-lg font-bold">
            <ChangeBadge value={technicals.daily_change_pct} />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">30-Day Change</p>
          <p className="mt-1 text-lg font-bold">
            <ChangeBadge value={technicals.thirty_day_change_pct} />
          </p>
        </div>
      </div>
    </div>
  );
}
