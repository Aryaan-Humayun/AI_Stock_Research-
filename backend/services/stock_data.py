from datetime import datetime, timedelta

import yfinance as yf


def fetch_price_history(ticker: str, days: int = 90):
    """Fetch OHLCV data for the last `days` days using yfinance."""
    period_days = max(days + 10, 100)
    yft = yf.Ticker(ticker)
    hist = yft.history(period=f"{period_days}d", interval="1d")

    if hist.empty:
        return []

    hist = hist.tail(days)

    records = []
    for index, row in hist.iterrows():
        records.append(
            {
                "date": index.to_pydatetime().replace(tzinfo=None),
                "open": float(row["Open"]) if row["Open"] == row["Open"] else None,
                "high": float(row["High"]) if row["High"] == row["High"] else None,
                "low": float(row["Low"]) if row["Low"] == row["Low"] else None,
                "close": float(row["Close"]) if row["Close"] == row["Close"] else None,
                "volume": float(row["Volume"]) if row["Volume"] == row["Volume"] else None,
            }
        )
    return records


def fetch_company_info(ticker: str):
    """Fetch basic company info: name, sector, market cap."""
    yft = yf.Ticker(ticker)
    info = None
    try:
        info = yft.get_info()
    except Exception:
        try:
            info = yft.info
        except Exception:
            info = None
    info = info or {}

    return {
        "ticker": ticker.upper(),
        "name": info.get("longName") or info.get("shortName") or ticker.upper(),
        "sector": info.get("sector"),
        "market_cap": info.get("marketCap"),
    }


def fetch_fundamentals(ticker: str):
    """Fetch fundamental metrics for a ticker using yfinance."""
    yft = yf.Ticker(ticker)
    info = None
    try:
        info = yft.get_info()
    except Exception:
        try:
            info = yft.info
        except Exception:
            info = None
    info = info or {}

    revenue = info.get("totalRevenue")

    return {
        "ticker": ticker.upper(),
        "pe_ratio": info.get("trailingPE"),
        "eps": info.get("trailingEps"),
        "market_cap": info.get("marketCap"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "revenue": revenue,
        "profit_margin": info.get("profitMargins"),
    }
