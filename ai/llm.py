"""LLM client: Claude, Gemini with key rotation, and local Ollama as the offline fallback."""
import json, time, urllib.request
from . import config

class LLMUnavailable(RuntimeError):
    pass


_CLIENTS = {}


def _client(key):
    """One client per key for the process lifetime. Building a client per call lets the
    previous one be garbage-collected, which closes the shared httpx transport and makes
    every later call fail with "Cannot send a request, as the client has been closed"."""
    if key not in _CLIENTS:
        from google import genai
        from google.genai import types
        # A hard timeout, so a slow network falls back instead of hanging the demo.
        _CLIENTS[key] = genai.Client(api_key=key, http_options=types.HttpOptions(timeout=config.LLM_TIMEOUT_MS))
    return _CLIENTS[key]


def _is_quota(e):
    """Quota errors, and 503 overload errors, which also clear after a short wait."""
    s = str(e)
    return any(m in s for m in ("RESOURCE_EXHAUSTED", "429", "UNAVAILABLE", "503"))


def _gemini(system, user, rounds=3, wait=20):
    """Try every model and key; on quota or overload errors, wait and try again.

    A per-minute limit clears after a short wait, so a couple of rounds rescues it.
    A daily limit never clears, so we give up quickly and let the caller fall back.
    """
    from google.genai import types
    last = None
    for attempt in range(rounds):
        worth_waiting = False
        for model, key in [(m, k) for m in config.GEMINI_MODELS for k in config.gemini_keys()]:
            try:
                r = _client(key).models.generate_content(
                    model=model, contents=user,
                    config=types.GenerateContentConfig(system_instruction=system, temperature=0.2))
                return (r.text or "").strip()
            except Exception as e:
                last = e
                if _is_quota(e):
                    # Overloads and per-minute limits clear; a per-day limit does not.
                    worth_waiting = worth_waiting or "PerDay" not in str(e)
                    continue
                raise
        if not worth_waiting:
            break
        if attempt < rounds - 1:
            print(f"    [llm] quota or overload on all models and keys, waiting {wait}s")
            time.sleep(wait)
    raise LLMUnavailable(str(last))


def _ollama(system, user):
    body = json.dumps({"model": config.OLLAMA_MODEL, "stream": False,
                       "options": {"temperature": 0.2},
                       "messages": [{"role": "system", "content": system},
                                    {"role": "user", "content": user}]}).encode()
    req = urllib.request.Request(config.OLLAMA_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read())["message"]["content"].strip()
    except Exception as e:
        raise LLMUnavailable(str(e))


_CLAUDE = None


def _claude(system, user):
    """One Claude call. The SDK already retries 429, 5xx and connection errors twice."""
    global _CLAUDE
    import anthropic
    if _CLAUDE is None:
        _CLAUDE = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    r = _CLAUDE.beta.messages.create(
        model=config.ANTHROPIC_MODEL, max_tokens=4096, system=system,
        messages=[{"role": "user", "content": user}],
        # Short grounded writing from given passages: low effort keeps the briefing fast.
        output_config={"effort": "low"},
        # A safety-classifier decline is re-run on Anthropic's recommended fallback model.
        betas=["server-side-fallback-2026-07-01"], fallbacks="default")
    if r.stop_reason == "refusal":
        raise LLMUnavailable(f"claude refused: {r.stop_details}")
    return "".join(b.text for b in r.content if b.type == "text").strip()


PROVIDERS = ["claude", "gemini", "ollama"]


def _configured(provider):
    if provider == "claude":
        return bool(config.ANTHROPIC_API_KEY and config.ANTHROPIC_MODEL)
    if provider == "gemini":
        return bool(config.gemini_keys() and config.GEMINI_MODELS)
    return bool(config.OLLAMA_MODEL)


def generate(system, user):
    """Try the configured provider, then the others in PROVIDERS order.
    Raises LLMUnavailable if none of them answers."""
    order = [config.LLM_PROVIDER] + [p for p in PROVIDERS if p != config.LLM_PROVIDER]
    last = None
    for provider in order:
        if not _configured(provider):
            continue
        primary = (provider == order[0])
        try:
            if provider == "claude":
                return _claude(system, user)
            # Only the primary provider is worth waiting out a per-minute quota or an overload
            # for; as a fallback it gets one quick pass so the request isn't held for a minute.
            if provider == "gemini":
                return _gemini(system, user, rounds=config.LLM_QUOTA_ROUNDS if primary else 1,
                               wait=config.LLM_QUOTA_WAIT)
            return _ollama(system, user)
        except Exception as e:
            print(f"    [llm] {provider} failed: {str(e)[:120]}")
            last = e
            time.sleep(1)
    raise LLMUnavailable(f"no LLM reachable: {last}")
