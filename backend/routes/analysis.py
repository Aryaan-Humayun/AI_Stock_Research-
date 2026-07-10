from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.stock import Stock
from models.price import PriceHistory
from models.news import NewsArticle
from models.fundamental import Fundamental
from models.report import AnalysisReport
from services import stock_data, news_service
from services.sentiment import analyze_sentiment
from services.analysis import run_analysis
from services.llm_service import LLMServiceError

router = APIRouter()


@router.post("/analyze/{ticker}")
def analyze_stock(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()

    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock '{ticker}' not found. Search for it before running analysis.",
        )

    try:
        info = stock_data.fetch_company_info(ticker)
        fundamentals_data = stock_data.fetch_fundamentals(ticker)
        price_records = stock_data.fetch_price_history(ticker, days=90)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stock data: {exc}")

    stock.name = info["name"]
    stock.sector = info["sector"]
    stock.market_cap = info["market_cap"]
    db.commit()

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

    if price_records:
        db.query(PriceHistory).filter(PriceHistory.ticker == ticker).delete()
        for record in price_records:
            db.add(PriceHistory(ticker=ticker, **record))
        db.commit()

    try:
        news_items = news_service.fetch_news(stock.name or ticker, max_results=10)
    except Exception:
        news_items = []

    if news_items:
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

    try:
        report = run_analysis(db, ticker)
    except LLMServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    import json

    return {
        "ticker": report.ticker,
        "report_text": report.report_text,
        "risk_score": report.risk_score,
        "opportunities": json.loads(report.opportunities or "[]"),
        "concerns": json.loads(report.concerns or "[]"),
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@router.get("/report/{ticker}")
def get_latest_report(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()

    report = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.ticker == ticker)
        .order_by(AnalysisReport.created_at.desc())
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail=f"No analysis report found for '{ticker}'.")

    import json

    return {
        "ticker": report.ticker,
        "report_text": report.report_text,
        "risk_score": report.risk_score,
        "opportunities": json.loads(report.opportunities or "[]"),
        "concerns": json.loads(report.concerns or "[]"),
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }
