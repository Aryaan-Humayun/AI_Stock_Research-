import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import BASE_DIR
from database import get_db
from models.stock import Stock
from models.price import PriceHistory
from models.news import NewsArticle
from models.fundamental import Fundamental
from services import stock_data, news_service
from services.sentiment import analyze_sentiment
from services.technical import compute_technicals

router = APIRouter()

# Locally, popular_stocks.json lives at <project_root>/backend/data/ (a
# subfolder of backend/, separate from the project-root data/ used for the
# SQLite DB). In the deployed Docker image, backend/'s contents are copied
# flat into /app, so it ends up merged into the same data/ directory as the
# DB. Try both so the same code works in both layouts.
_POPULAR_STOCKS_CANDIDATES = [
    BASE_DIR / "backend" / "data" / "popular_stocks.json",  # local dev
    BASE_DIR / "data" / "popular_stocks.json",  # deployed (flat-copy) layout
]
_POPULAR_STOCKS_PATH = next(
    (p for p in _POPULAR_STOCKS_CANDIDATES if p.exists()), _POPULAR_STOCKS_CANDIDATES[0]
)
_popular_stocks_cache = None


def _load_popular_stocks():
    global _popular_stocks_cache
    if _popular_stocks_cache is None:
        with open(_POPULAR_STOCKS_PATH, encoding="utf-8") as f:
            _popular_stocks_cache = json.load(f)
    return _popular_stocks_cache


@router.get("/search-suggestions")
def search_suggestions(q: str = ""):
    query = q.strip().lower()
    if not query:
        return []

    stocks = _load_popular_stocks()

    ticker_exact = []
    ticker_prefix = []
    ticker_contains = []
    name_matches = []

    for stock in stocks:
        ticker_lower = stock["ticker"].lower()
        name_lower = stock["name"].lower()

        if ticker_lower == query:
            ticker_exact.append(stock)
        elif ticker_lower.startswith(query):
            ticker_prefix.append(stock)
        elif query in ticker_lower:
            ticker_contains.append(stock)
        elif query in name_lower:
            name_matches.append(stock)

    results = ticker_exact + ticker_prefix + ticker_contains + name_matches
    return results[:8]


@router.get("/search/{ticker}")
def search_stock(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()

    try:
        info = stock_data.fetch_company_info(ticker)
        fundamentals_data = stock_data.fetch_fundamentals(ticker)
        price_records = stock_data.fetch_price_history(ticker, days=90)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stock data: {exc}")

    if not price_records:
        raise HTTPException(status_code=404, detail=f"No data found for ticker '{ticker}'.")

    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        stock = Stock(ticker=ticker)
        db.add(stock)

    stock.name = info["name"]
    stock.sector = info["sector"]
    stock.market_cap = info["market_cap"]
    db.commit()
    db.refresh(stock)

    fundamentals = db.query(Fundamental).filter(Fundamental.ticker == ticker).first()
    if not fundamentals:
        fundamentals = Fundamental(ticker=ticker)
        db.add(fundamentals)

    fundamentals.pe_ratio = fundamentals_data["pe_ratio"]
    fundamentals.eps = fundamentals_data["eps"]
    fundamentals.market_cap = fundamentals_data["market_cap"]
    fundamentals.fifty_two_week_high = fundamentals_data["fifty_two_week_high"]
    fundamentals.fifty_two_week_low = fundamentals_data["fifty_two_week_low"]
    fundamentals.revenue = fundamentals_data["revenue"]
    fundamentals.profit_margin = fundamentals_data["profit_margin"]
    db.commit()

    db.query(PriceHistory).filter(PriceHistory.ticker == ticker).delete()
    for record in price_records:
        db.add(PriceHistory(ticker=ticker, **record))
    db.commit()

    try:
        news_items = news_service.fetch_news(stock.name or ticker, max_results=10)
    except Exception:
        news_items = []

    sentiments = analyze_sentiment(news_items)

    db.query(NewsArticle).filter(NewsArticle.ticker == ticker).delete()
    for item, sentiment in zip(news_items, sentiments):
        db.add(
            NewsArticle(
                ticker=ticker,
                title=item.get("title"),
                description=item.get("description"),
                url=item.get("url"),
                source=item.get("source"),
                published_at=item.get("published_at"),
                sentiment_score=sentiment.get("confidence"),
                sentiment_label=sentiment.get("label"),
            )
        )
    db.commit()

    return {
        "ticker": ticker,
        "name": stock.name,
        "sector": stock.sector,
        "market_cap": stock.market_cap,
        "latest_price": price_records[-1]["close"] if price_records else None,
        "news_count": len(news_items),
    }


@router.get("/stock/{ticker}")
def get_stock(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()

    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{ticker}' not found. Search for it first.")

    fundamentals = db.query(Fundamental).filter(Fundamental.ticker == ticker).first()

    prices = (
        db.query(PriceHistory)
        .filter(PriceHistory.ticker == ticker)
        .order_by(PriceHistory.date.asc())
        .all()
    )

    news = (
        db.query(NewsArticle)
        .filter(NewsArticle.ticker == ticker)
        .order_by(NewsArticle.published_at.desc())
        .all()
    )

    technicals = compute_technicals([{"close": p.close} for p in prices])

    return {
        "stock": {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "market_cap": stock.market_cap,
            "in_watchlist": stock.in_watchlist,
        },
        "fundamentals": (
            {
                "pe_ratio": fundamentals.pe_ratio,
                "eps": fundamentals.eps,
                "market_cap": fundamentals.market_cap,
                "fifty_two_week_high": fundamentals.fifty_two_week_high,
                "fifty_two_week_low": fundamentals.fifty_two_week_low,
                "revenue": fundamentals.revenue,
                "profit_margin": fundamentals.profit_margin,
            }
            if fundamentals
            else None
        ),
        "prices": [
            {
                "date": p.date.isoformat(),
                "open": p.open,
                "high": p.high,
                "low": p.low,
                "close": p.close,
                "volume": p.volume,
            }
            for p in prices
        ],
        "news": [
            {
                "title": n.title,
                "description": n.description,
                "url": n.url,
                "source": n.source,
                "published_at": n.published_at.isoformat() if n.published_at else None,
                "sentiment_score": n.sentiment_score,
                "sentiment_label": n.sentiment_label,
            }
            for n in news
        ],
        "technicals": technicals,
    }


@router.get("/watchlist")
def get_watchlist(db: Session = Depends(get_db)):
    stocks = db.query(Stock).filter(Stock.in_watchlist == True).all()  # noqa: E712

    results = []
    for stock in stocks:
        latest_price = (
            db.query(PriceHistory)
            .filter(PriceHistory.ticker == stock.ticker)
            .order_by(PriceHistory.date.desc())
            .first()
        )
        prev_price = (
            db.query(PriceHistory)
            .filter(PriceHistory.ticker == stock.ticker)
            .order_by(PriceHistory.date.desc())
            .offset(1)
            .first()
        )

        daily_change_pct = None
        if latest_price and prev_price and prev_price.close:
            daily_change_pct = round(
                ((latest_price.close - prev_price.close) / prev_price.close) * 100, 2
            )

        sparkline_prices = (
            db.query(PriceHistory)
            .filter(PriceHistory.ticker == stock.ticker)
            .order_by(PriceHistory.date.desc())
            .limit(30)
            .all()
        )
        sparkline = [p.close for p in reversed(sparkline_prices)]

        news_articles = (
            db.query(NewsArticle)
            .filter(NewsArticle.ticker == stock.ticker)
            .order_by(NewsArticle.published_at.desc())
            .limit(5)
            .all()
        )
        bullish = sum(1 for n in news_articles if n.sentiment_label == "bullish")
        bearish = sum(1 for n in news_articles if n.sentiment_label == "bearish")
        if bullish > bearish:
            overall_sentiment = "bullish"
        elif bearish > bullish:
            overall_sentiment = "bearish"
        else:
            overall_sentiment = "neutral"

        results.append(
            {
                "ticker": stock.ticker,
                "name": stock.name,
                "sector": stock.sector,
                "latest_price": latest_price.close if latest_price else None,
                "daily_change_pct": daily_change_pct,
                "sentiment": overall_sentiment,
                "sparkline": sparkline,
            }
        )

    return results


@router.delete("/watchlist")
def clear_watchlist(db: Session = Depends(get_db)):
    stocks = db.query(Stock).filter(Stock.in_watchlist == True).all()  # noqa: E712
    for stock in stocks:
        stock.in_watchlist = False
    db.commit()
    return {"cleared": len(stocks)}


@router.post("/watchlist/{ticker}")
def add_to_watchlist(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()
    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{ticker}' not found. Search for it first.")

    stock.in_watchlist = True
    db.commit()
    return {"ticker": ticker, "in_watchlist": True}


@router.delete("/watchlist/{ticker}")
def remove_from_watchlist(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()
    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{ticker}' not found.")

    stock.in_watchlist = False
    db.commit()
    return {"ticker": ticker, "in_watchlist": False}
