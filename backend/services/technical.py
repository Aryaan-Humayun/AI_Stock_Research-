def _closes(price_history):
    return [p["close"] for p in price_history if p.get("close") is not None]


def sma(values, period):
    if len(values) < period:
        return None
    window = values[-period:]
    return sum(window) / period


def ema_series(values, period):
    """Return the full EMA series for `values` using the given period."""
    if not values:
        return []
    k = 2 / (period + 1)
    ema_values = [values[0]]
    for price in values[1:]:
        ema_values.append(price * k + ema_values[-1] * (1 - k))
    return ema_values


def rsi(values, period=14):
    if len(values) < period + 1:
        return None

    gains = []
    losses = []
    for i in range(1, len(values)):
        change = values[i] - values[i - 1]
        gains.append(max(change, 0))
        losses.append(max(-change, 0))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def macd(values, fast=12, slow=26, signal=9):
    if len(values) < slow + signal:
        return None

    ema_fast = ema_series(values, fast)
    ema_slow = ema_series(values, slow)
    macd_line = [f - s for f, s in zip(ema_fast, ema_slow)]
    signal_line = ema_series(macd_line, signal)
    histogram = macd_line[-1] - signal_line[-1]

    return {
        "macd_line": round(macd_line[-1], 4),
        "signal_line": round(signal_line[-1], 4),
        "histogram": round(histogram, 4),
    }


def daily_change_pct(values):
    if len(values) < 2:
        return None
    return round(((values[-1] - values[-2]) / values[-2]) * 100, 2)


def thirty_day_change_pct(values):
    if len(values) < 31:
        if len(values) < 2:
            return None
        reference = values[0]
    else:
        reference = values[-31]
    return round(((values[-1] - reference) / reference) * 100, 2)


def compute_technicals(price_history):
    """Compute technical indicators from a list of price dicts sorted ascending by date."""
    values = _closes(price_history)

    if not values:
        return {
            "sma_20": None,
            "sma_50": None,
            "rsi_14": None,
            "macd": None,
            "daily_change_pct": None,
            "thirty_day_change_pct": None,
        }

    sma_20 = sma(values, 20)
    sma_50 = sma(values, 50)
    rsi_14 = rsi(values, 14)
    macd_result = macd(values)

    return {
        "sma_20": round(sma_20, 2) if sma_20 is not None else None,
        "sma_50": round(sma_50, 2) if sma_50 is not None else None,
        "rsi_14": round(rsi_14, 2) if rsi_14 is not None else None,
        "macd": macd_result,
        "daily_change_pct": daily_change_pct(values),
        "thirty_day_change_pct": thirty_day_change_pct(values),
    }
