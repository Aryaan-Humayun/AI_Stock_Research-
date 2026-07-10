import json
import re

from services.llm_service import call_llm, LLMServiceError

VALID_LABELS = {"bullish", "bearish", "neutral"}


def _extract_json(text: str):
    """Best-effort extraction of a JSON array from LLM output."""
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _default_result(count: int):
    return [{"label": "neutral", "confidence": 0.5} for _ in range(count)]


def analyze_sentiment(articles: list) -> list:
    """Classify a list of news articles as bullish/bearish/neutral.

    Each article dict should contain 'title' and 'description'.
    Returns a list of {"label": str, "confidence": float} in the same order.
    """
    if not articles:
        return []

    numbered_items = []
    for i, article in enumerate(articles):
        title = article.get("title") or ""
        description = article.get("description") or ""
        numbered_items.append(f"{i + 1}. Title: {title}\n   Summary: {description}")

    joined = "\n".join(numbered_items)

    prompt = f"""You are a financial sentiment analysis assistant. Classify each news headline below as
"bullish", "bearish", or "neutral" for the company's stock, and give a confidence between 0 and 1.

News items:
{joined}

Respond with ONLY a JSON array of {len(articles)} objects, in the same order as the items above, like:
[{{"label": "bullish", "confidence": 0.8}}, {{"label": "neutral", "confidence": 0.6}}]

Do not include any explanation, only the JSON array."""

    try:
        response_text = call_llm(prompt, format_json=False, use_fast=True)
    except LLMServiceError:
        return _default_result(len(articles))

    parsed = _extract_json(response_text)
    if not parsed or not isinstance(parsed, list):
        return _default_result(len(articles))

    results = []
    for i in range(len(articles)):
        if i < len(parsed) and isinstance(parsed[i], dict):
            label = str(parsed[i].get("label", "neutral")).lower().strip()
            if label not in VALID_LABELS:
                label = "neutral"
            try:
                confidence = float(parsed[i].get("confidence", 0.5))
            except (TypeError, ValueError):
                confidence = 0.5
            confidence = max(0.0, min(1.0, confidence))
            results.append({"label": label, "confidence": confidence})
        else:
            results.append({"label": "neutral", "confidence": 0.5})

    return results
