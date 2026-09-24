"""LLM client: Gemini with key rotation, local Ollama as the offline fallback."""
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
    return "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e)


def _gemini(system, user, rounds=3, wait=20):
    """Try every key; on a per-minute quota error, wait and try again.

    A per-minute limit clears after a short wait, so a couple of rounds rescues it.
    A daily limit never clears, so we give up quickly and let the caller fall back.
    """
    from google.genai import types
    last = None
    for attempt in range(rounds):
        for key in config.gemini_keys():
            try:
                r = _client(key).models.generate_content(
                    model=config.GEMINI_MODEL, contents=user,
                    config=types.GenerateContentConfig(system_instruction=system or None, temperature=0.2))
                return (r.text or "").strip()
            except Exception as e:
                last = e
                if _is_quota(e):
                    continue
                raise
        if attempt < rounds - 1:
            print(f"    [llm] quota hit on all keys, waiting {wait}s")
            time.sleep(wait)
    raise LLMUnavailable(str(last))


def _ollama(system, user):
    body = json.dumps({"model": config.OLLAMA_MODEL, "stream": False,
                       "options": {"temperature": 0.2},
                       "messages": ([{"role": "system", "content": system}] if system else [])
                                   + [{"role": "user", "content": user}]}).encode()
    req = urllib.request.Request(config.OLLAMA_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read())["message"]["content"].strip()
    except Exception as e:
        raise LLMUnavailable(str(e))


def generate(system, user):
    """Try the configured provider, then fall back. Raises LLMUnavailable if both fail."""
    order = ["gemini", "ollama"] if config.LLM_PROVIDER == "gemini" else ["ollama", "gemini"]
    last = None
    for provider in order:
        if provider == "gemini" and not (config.gemini_keys() and config.GEMINI_MODEL):
            continue
        if provider == "ollama" and not config.OLLAMA_MODEL:
            continue
        primary = (provider == order[0])
        try:
            # Only the primary provider is worth waiting out a per-minute quota for;
            # as a fallback it gets one quick attempt so the request isn't held for a minute.
            return (_gemini(system, user, rounds=config.LLM_QUOTA_ROUNDS if primary else 1,
                            wait=config.LLM_QUOTA_WAIT) if provider == "gemini"
                    else _ollama(system, user))
        except Exception as e:
            last = e
            time.sleep(1)
    raise LLMUnavailable(f"no LLM reachable: {last}")
