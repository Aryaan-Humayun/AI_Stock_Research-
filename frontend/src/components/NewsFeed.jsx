const SENTIMENT_STYLES = {
  bullish: { border: "border-l-green-500", badge: "bg-green-900/40 text-green-400", label: "Bullish" },
  bearish: { border: "border-l-red-500", badge: "bg-red-900/40 text-red-400", label: "Bearish" },
  neutral: { border: "border-l-gray-500", badge: "bg-gray-700 text-gray-300", label: "Neutral" },
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
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-gray-500">
        No recent news available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">Recent News</h3>
      <div className="flex flex-col gap-3">
        {news.map((article, idx) => {
          const style = SENTIMENT_STYLES[article.sentiment_label] || SENTIMENT_STYLES.neutral;
          return (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-lg border-l-4 ${style.border} bg-gray-900 p-3 transition hover:bg-gray-750`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-medium text-gray-100">{article.title}</p>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                  {style.label}
                </span>
              </div>
              {article.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-400">{article.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>{article.source}</span>
                {article.published_at && (
                  <>
                    <span>&middot;</span>
                    <span>{formatDate(article.published_at)}</span>
                  </>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
