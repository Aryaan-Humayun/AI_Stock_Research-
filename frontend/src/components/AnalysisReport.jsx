function riskColor(score) {
  if (score == null) return "#64748B";
  if (score <= 3) return "#10B981";
  if (score <= 6) return "#F59E0B";
  return "#EF4444";
}

function riskLabel(score) {
  if (score == null) return "Unknown";
  if (score <= 3) return "Low Risk";
  if (score <= 6) return "Moderate Risk";
  if (score <= 8) return "High Risk";
  return "Very High Risk";
}

function RiskGauge({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? Math.max(0, Math.min(10, score)) / 10 : 0;
  const offset = circumference * (1 - pct);
  const color = riskColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score ?? "—"}</span>
          <span className="text-[10px] text-text-muted">/ 10</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {riskLabel(score)}
      </span>
    </div>
  );
}

function InsightColumn({ title, items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold" style={{ color }}>
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 rounded-lg border-l-4 bg-white/5 p-3 text-sm text-text-secondary"
            style={{ borderLeftColor: color }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

function renderReportText(text) {
  const sections = text.split(/\n(?=## )/g);
  return sections.map((section, idx) => {
    const match = section.match(/^##\s+(.+)\n([\s\S]*)$/);
    if (!match) {
      return (
        <p key={idx} className="whitespace-pre-wrap text-sm text-text-secondary">
          {section}
        </p>
      );
    }
    const [, heading, body] = match;
    const trimmedBody = body.trim();

    if (/investment summary/i.test(heading)) {
      return (
        <div key={idx} className="mb-4 last:mb-0 rounded-xl border border-accent-blue/20 bg-accent-blue/10 p-4">
          <h4 className="mb-1 border-l-2 border-accent-blue pl-2 text-xs font-semibold uppercase tracking-wide text-accent-blue">
            {heading}
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{trimmedBody}</p>
        </div>
      );
    }

    return (
      <div key={idx} className="mb-4 last:mb-0">
        <h4 className="mb-1 border-l-2 border-white/15 pl-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {heading}
        </h4>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{trimmedBody}</p>
      </div>
    );
  });
}

function GenerateButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="group/sweep relative overflow-hidden rounded-xl bg-gradient-to-r from-accent-blue to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-blue/25 transition-transform duration-200 active:scale-95"
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="animate-sweep absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-md" />
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">{label}</span>
    </button>
  );
}

export default function AnalysisReport({ report, onGenerate, loading, ticker }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-secondary">
      <div className="h-[3px] w-full bg-gradient-to-r from-accent-blue to-purple-600" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-secondary">AI Analysis</h3>
          {report && !loading && <GenerateButton onClick={onGenerate} label="✨ Regenerate" />}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-white/5 py-12 text-center">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-accent-blue to-purple-500" />
            </div>
            <p className="text-sm text-text-secondary">
              🤖 AI is analyzing {ticker || "this stock"}
              <TypingDots />
            </p>
            <p className="max-w-sm text-xs text-text-muted">
              This may take up to a minute (sometimes longer on slower hardware).
            </p>
          </div>
        )}

        {!loading && !report && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/5 py-12 text-center">
            <p className="max-w-sm text-sm text-text-secondary">
              No AI analysis yet. Generate one to get insights on {ticker || "this stock"}.
            </p>
            <GenerateButton onClick={onGenerate} label="✨ Generate AI Report" />
          </div>
        )}

        {!loading && report && (
          <div className="flex animate-fade-in flex-col gap-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <RiskGauge score={report.risk_score} />
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <InsightColumn title="Opportunities" items={report.opportunities} color="#10B981" />
                <InsightColumn title="Concerns" items={report.concerns} color="#EF4444" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">{renderReportText(report.report_text)}</div>

            {report.created_at && (
              <p className="text-right text-xs text-text-muted">
                Generated on {new Date(report.created_at).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
