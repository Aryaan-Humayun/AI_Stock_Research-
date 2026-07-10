from datetime import datetime

from gnews import GNews


def _parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %Z")
    except (ValueError, TypeError):
        return None


def fetch_news(query: str, max_results: int = 10):
    """Fetch recent news articles for a company/ticker using gnews."""
    google_news = GNews(language="en", country="US", period="7d", max_results=max_results)

    try:
        results = google_news.get_news(query)
    except Exception:
        results = []

    articles = []
    for item in results[:max_results]:
        publisher = item.get("publisher") or {}
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("description"),
                "url": item.get("url"),
                "source": publisher.get("title") if isinstance(publisher, dict) else publisher,
                "published_at": _parse_date(item.get("published date")),
            }
        )
    return articles
