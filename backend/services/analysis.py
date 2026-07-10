import json
import re
import time

from sqlalchemy.orm import Session

from models.stock import Stock
from models.price import PriceHistory
from models.news import NewsArticle
from models.fundamental import Fundamental
from models.report import AnalysisReport
from config import LLM_PROVIDER
from services.llm_service import call_llm, LLMServiceError
from services.technical import compute_technicals


def _extract_json_object(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _build_prompt(stock, fundamentals, price_records, news_articles, technicals):
    news_lines = []
    for article in news_articles:
        news_lines.append(
            f"- [{article.sentiment_label or 'neutral'}] {article.title}"
        )
    news_block = "\n".join(news_lines) if news_lines else "No recent news available."

    latest_close = price_records[-1].close if price_records else None

    fundamentals_block = "No fundamental data available."
    if fundamentals:
        fundamentals_block = (
            f"P/E Ratio: {fundamentals.pe_ratio}\n"
            f"EPS: {fundamentals.eps}\n"
            f"Market Cap: {fundamentals.market_cap}\n"
            f"52-Week High: {fundamentals.fifty_two_week_high}\n"
            f"52-Week Low: {fundamentals.fifty_two_week_low}\n"
            f"Revenue: {fundamentals.revenue}\n"
            f"Profit Margin: {fundamentals.profit_margin}"
        )

    technicals_block = (
        f"SMA 20: {technicals['sma_20']}\n"
        f"SMA 50: {technicals['sma_50']}\n"
        f"RSI 14: {technicals['rsi_14']}\n"
        f"MACD: {technicals['macd']}\n"
        f"Daily Change %: {technicals['daily_change_pct']}\n"
        f"30-Day Change %: {technicals['thirty_day_change_pct']}"
    )

    prompt = f"""You are a professional equity research analyst. Analyze the stock below using the data provided.

Company: {stock.name} ({stock.ticker})
Sector: {stock.sector}
Latest Close Price: {latest_close}

FUNDAMENTALS:
{fundamentals_block}

TECHNICAL INDICATORS:
{technicals_block}

RECENT NEWS (with sentiment):
{news_block}

Based strictly on the data above, produce a research report. Respond with ONLY a JSON object with these exact keys:
{{
  "overview": "a short company overview paragraph",
  "trend_analysis": "a paragraph analyzing the price trend and technical indicators",
  "risk_score": an integer from 1 (very low risk) to 10 (very high risk),
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "concerns": ["concern 1", "concern 2", "concern 3"],
  "investment_summary": "a concluding paragraph summarizing the investment case"
}}

Do not include any text outside the JSON object."""

    return prompt


def run_analysis(db: Session, ticker: str) -> AnalysisReport:
    ticker = ticker.upper()

    stock = db.query(Stock).filter(Stock.ticker == ticker).first()
    if not stock:
        raise ValueError(f"Stock {ticker} not found. Search for it first.")

    fundamentals = db.query(Fundamental).filter(Fundamental.ticker == ticker).first()

    price_records = (
        db.query(PriceHistory)
        .filter(PriceHistory.ticker == ticker)
        .order_by(PriceHistory.date.asc())
        .all()
    )

    news_articles = (
        db.query(NewsArticle)
        .filter(NewsArticle.ticker == ticker)
        .order_by(NewsArticle.published_at.desc())
        .limit(10)
        .all()
    )

    price_dicts = [{"close": p.close} for p in price_records]
    technicals = compute_technicals(price_dicts)

    prompt = _build_prompt(stock, fundamentals, price_records, news_articles, technicals)

    if LLM_PROVIDER == "openrouter":
        # Give OpenRouter breathing room after the sentiment call that just ran,
        # so we don't immediately trip the free-tier rate limit.
        time.sleep(5)

    start_time = time.time()
    try:
        response_text = call_llm(prompt)
    except LLMServiceError as exc:
        raise
    elapsed = time.time() - start_time
    print(f"[analysis] Ollama call for {ticker} took {elapsed:.2f}s")

    parsed = _extract_json_object(response_text)

    if not parsed:
        overview = "AI analysis could not be parsed. Raw model output is shown below."
        trend_analysis = ""
        risk_score = 5
        opportunities = []
        concerns = []
        investment_summary = response_text[:2000]
    else:
        overview = parsed.get("overview", "")
        trend_analysis = parsed.get("trend_analysis", "")
        try:
            risk_score = int(parsed.get("risk_score", 5))
        except (TypeError, ValueError):
            risk_score = 5
        risk_score = max(1, min(10, risk_score))
        opportunities = parsed.get("opportunities", [])
        concerns = parsed.get("concerns", [])
        investment_summary = parsed.get("investment_summary", "")

    report_text = (
        f"## Company Overview\n{overview}\n\n"
        f"## Trend Analysis\n{trend_analysis}\n\n"
        f"## Investment Summary\n{investment_summary}"
    )

    report = AnalysisReport(
        ticker=ticker,
        report_text=report_text,
        risk_score=risk_score,
        opportunities=json.dumps(opportunities),
        concerns=json.dumps(concerns),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report
