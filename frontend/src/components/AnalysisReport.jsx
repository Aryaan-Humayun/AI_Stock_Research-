function riskColor(score) {
  if (score == null) return "#898781";
  if (score <= 3) return "#0ca30c";
  if (score <= 6) return "#fab219";
  if (score <= 8) return "#ec835a";
  return "#d03b3b";
}

function riskLabel(score) {
  if (score == null) return "Unknown";
  if (score <= 3) return "Low Risk";
  if (score <= 6) return "Moderate Risk";
  if (score <= 8) return "High Risk";
  return "Very High Risk";
}

function RiskGauge({ score }) {
  const color = riskColor(score);
  const pct = score != null ? (score / 10) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Risk Score</span>
        <span
          className="rounded px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${color}33`, color }}
        >
          {score != null ? `${score}/10` : "—"} &middot; {riskLabel(score)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, #0ca30c, #fab219 50%, #d03b3b)",
          }}
        />
      </div>
    </div>
  );
}

function InsightCards({ items, borderColor }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={`rounded-lg border-l-4 bg-gray-900 p-3 text-sm text-gray-300 ${borderColor}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function renderReportText(text) {
  const sections = text.split(/\n(?=## )/g);
  return sections.map((section, idx) => {
    const match = section.match(/^##\s+(.+)\n([\s\S]*)$/);
    if (!match) {
      return (
        <p key={idx} className="whitespace-pre-wrap text-sm text-gray-300">
          {section}
        </p>
      );
    }
    const [, heading, body] = match;
    return (
      <div key={idx} className="mb-4 last:mb-0">
        <h4 className="mb-1 text-sm font-semibold text-blue-400">{heading}</h4>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{body.trim()}</p>
      </div>
    );
  });
}

export default function AnalysisReport({ report, onGenerate, loading }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">AI Analysis</h3>
        {report && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            {loading ? "Generating..." : "Regenerate Analysis"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
          <p className="text-sm text-gray-400">
            Analyzing... this may take up to a minute (sometimes longer on slower hardware).
          </p>
        </div>
      )}

      {!loading && !report && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-gray-700 bg-gray-900 py-10 text-center">
          <p className="max-w-sm text-sm text-gray-400">
            No AI analysis yet. Generate one to get insights on this stock.
          </p>
          <button
            onClick={onGenerate}
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-blue-500"
          >
            ✨ Generate Analysis
          </button>
        </div>
      )}

      {!loading && report && (
        <div className="flex animate-fade-in flex-col gap-4">
          <RiskGauge score={report.risk_score} />

          {report.opportunities && report.opportunities.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-green-400">Opportunities</h4>
              <InsightCards items={report.opportunities} borderColor="border-green-500" />
            </div>
          )}

          {report.concerns && report.concerns.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-red-400">Concerns</h4>
              <InsightCards items={report.concerns} borderColor="border-red-500" />
            </div>
          )}

          <div className="border-t border-gray-700 pt-3">{renderReportText(report.report_text)}</div>

          {report.created_at && (
            <p className="text-xs text-gray-500">
              Generated on {new Date(report.created_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
