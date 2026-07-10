import threading
import time

import requests

from config import (
    LLM_PROVIDER,
    OLLAMA_MODEL,
    OLLAMA_FAST_MODEL,
    OLLAMA_URL,
    OPENROUTER_API_KEY,
    OPENROUTER_URL,
    OPENROUTER_MODEL,
    OPENROUTER_FAST_MODEL,
)

TIMEOUT_SECONDS = 300

# OpenRouter's free tier allows ~20 requests/minute. Space calls at least this far
# apart so we stay safely under that (60s / 4s = 15 req/min).
_OPENROUTER_MIN_INTERVAL_SECONDS = 4
_OPENROUTER_MAX_RETRIES = 3
_OPENROUTER_RETRY_WAIT_SECONDS = 10

_openrouter_rate_lock = threading.Lock()
_last_openrouter_request_time = 0.0


def _throttle_openrouter():
    """Block until at least _OPENROUTER_MIN_INTERVAL_SECONDS have passed since
    the last OpenRouter request, to stay under the free-tier rate limit."""
    global _last_openrouter_request_time
    with _openrouter_rate_lock:
        elapsed = time.time() - _last_openrouter_request_time
        if elapsed < _OPENROUTER_MIN_INTERVAL_SECONDS:
            time.sleep(_OPENROUTER_MIN_INTERVAL_SECONDS - elapsed)
        _last_openrouter_request_time = time.time()

# Common mojibake patterns from UTF-8 bytes that got decoded as cp1252 somewhere
# upstream (smart quotes, dashes). Keys/values are written as explicit \u escapes
# so the exact codepoints are unambiguous regardless of source file encoding.
_MOJIBAKE_REPLACEMENTS = {
    "â€™": "’",  # -> ' (right single quote)
    "â€œ": "“",  # -> " (left double quote)
    "â€": "”",  # -> " (right double quote)
    "â€”": "—",  # -> — (em dash)
    "â€“": "–",  # -> – (en dash)
}


class LLMServiceError(Exception):
    pass


def _clean_mojibake(text: str) -> str:
    """Fix common UTF-8-decoded-as-cp1252 mojibake in LLM output."""
    for bad, good in _MOJIBAKE_REPLACEMENTS.items():
        text = text.replace(bad, good)
    return text


def _timeout_message(selected_model: str) -> str:
    return (
        f"The '{selected_model}' model took too long to respond (over "
        f"{TIMEOUT_SECONDS} seconds) and the request timed out. Try again, "
        "or switch to a smaller/faster model."
    )


def _call_ollama(prompt: str, selected_model: str, format_json: bool) -> str:
    payload = {
        "model": selected_model,
        "prompt": prompt,
        "stream": False,
    }
    if format_json:
        payload["format"] = "json"

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.exceptions.ConnectionError as exc:
        raise LLMServiceError(
            f"Could not connect to Ollama at {OLLAMA_URL}. Is Ollama running?"
        ) from exc
    except requests.exceptions.Timeout:
        return _timeout_message(selected_model)
    except requests.exceptions.HTTPError as exc:
        raise LLMServiceError(f"Ollama returned an error: {exc}") from exc

    response.encoding = "utf-8"
    return _clean_mojibake(response.json().get("response", ""))


def _call_openrouter(prompt: str, selected_model: str, format_json: bool) -> str:
    if not OPENROUTER_API_KEY:
        raise LLMServiceError(
            "OPENROUTER_API_KEY is not set. Add it to your .env file."
        )

    payload = {
        "model": selected_model,
        "messages": [{"role": "user", "content": prompt}],
    }
    if format_json:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    retries_used = 0
    while True:
        _throttle_openrouter()
        try:
            response = requests.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=TIMEOUT_SECONDS,
            )
        except requests.exceptions.ConnectionError as exc:
            raise LLMServiceError(
                "Could not connect to OpenRouter. Check your network connection."
            ) from exc
        except requests.exceptions.Timeout:
            return _timeout_message(selected_model)

        if response.status_code == 429 and retries_used < _OPENROUTER_MAX_RETRIES:
            retries_used += 1
            print(
                f"[llm_service] OpenRouter 429 rate-limited, retrying "
                f"({retries_used}/{_OPENROUTER_MAX_RETRIES}) after "
                f"{_OPENROUTER_RETRY_WAIT_SECONDS}s..."
            )
            time.sleep(_OPENROUTER_RETRY_WAIT_SECONDS)
            continue

        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            raise LLMServiceError(f"OpenRouter returned an error: {exc}") from exc

        break

    response.encoding = "utf-8"
    data = response.json()
    try:
        return _clean_mojibake(data["choices"][0]["message"]["content"])
    except (KeyError, IndexError) as exc:
        raise LLMServiceError(f"Unexpected OpenRouter response format: {data}") from exc


def call_llm(prompt: str, model: str = None, format_json: bool = False, use_fast: bool = False) -> str:
    """Send a prompt to the configured LLM provider and return the generated text.

    The provider is selected by the LLM_PROVIDER env var ("ollama" or
    "openrouter"). Pass use_fast=True to use each provider's FAST_MODEL instead
    of its default model — useful for simpler tasks like sentiment
    classification where speed matters more than depth. An explicit `model`
    always takes priority over both.

    Raises LLMServiceError if the provider is unreachable, misconfigured, or
    returns an HTTP error. If the model times out, a friendly error message is
    returned instead of raising, so callers can surface it to the user without
    crashing.
    """
    if LLM_PROVIDER == "openrouter":
        selected_model = model or (OPENROUTER_FAST_MODEL if use_fast else OPENROUTER_MODEL)
        return _call_openrouter(prompt, selected_model, format_json)

    selected_model = model or (OLLAMA_FAST_MODEL if use_fast else OLLAMA_MODEL)
    return _call_ollama(prompt, selected_model, format_json)


def check_ollama_health() -> bool:
    """Return True if the configured LLM provider is reachable/usable."""
    if LLM_PROVIDER == "openrouter":
        return bool(OPENROUTER_API_KEY) and not OPENROUTER_API_KEY.upper().startswith("PASTE_")

    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False
