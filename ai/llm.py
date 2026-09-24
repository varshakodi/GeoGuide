"""LLM client: Gemini with key rotation, local Ollama as the offline fallback."""
import json, time, urllib.request
from . import config

class LLMUnavailable(RuntimeError):
    pass


def _gemini(system, user):
    from google import genai
    from google.genai import types
    last = None
    for key in config.gemini_keys():
        try:
            client = genai.Client(api_key=key)
            r = client.models.generate_content(
                model=config.GEMINI_MODEL, contents=user,
                config=types.GenerateContentConfig(system_instruction=system, temperature=0.2))
            return (r.text or "").strip()
        except Exception as e:                       # quota, network, bad key
            last = e
            if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                continue
            raise
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


def generate(system, user):
    """Try the configured provider, then fall back. Raises LLMUnavailable if both fail."""
    order = ["gemini", "ollama"] if config.LLM_PROVIDER == "gemini" else ["ollama", "gemini"]
    last = None
    for provider in order:
        if provider == "gemini" and not (config.gemini_keys() and config.GEMINI_MODEL):
            continue
        if provider == "ollama" and not config.OLLAMA_MODEL:
            continue
        try:
            return _gemini(system, user) if provider == "gemini" else _ollama(system, user)
        except Exception as e:
            last = e
            time.sleep(1)
    raise LLMUnavailable(f"no LLM reachable: {last}")
