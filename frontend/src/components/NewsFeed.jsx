const SENTIMENT_STYLES = {
  bullish: { color: "#10B981", badge: "bg-accent-green/15 text-accent-green", label: "Bullish" },
  bearish: { color: "#EF4444", badge: "bg-accent-red/15 text-accent-red", label: "Bearish" },
  neutral: { color: "#F59E0B", badge: "bg-accent-amber/15 text-accent-amber", label: "Neutral" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsFeed({ news }) {
  if (!news || news.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6 text-text-muted">
        No recent news available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-secondary p-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span>📰</span> Latest News
      </h3>
      <div className="flex flex-col">
        {news.map((article, idx) => {
          const style = SENTIMENT_STYLES[article.sentiment_label] || SENTIMENT_STYLES.neutral;
          return (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 py-3 transition-colors hover:bg-white/5 ${
                idx !== news.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: style.color, boxShadow: `0 0 8px ${style.color}` }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{article.title}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                  <span>{article.source}</span>
                  {article.published_at && (
                    <>
                      <span>&middot;</span>
                      <span>{formatDate(article.published_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}
              >
                {style.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
