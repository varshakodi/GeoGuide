"""Sarvam translation of finished, cited claims.

The model always writes English, where the relevance gate, sentinel and citation check
are most reliable. Each surviving claim is then translated one by one, so every
translated sentence keeps exactly the source labels its English original earned.
Any translation failure keeps the English answer rather than failing the request.
"""
import json
import ssl
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path

from . import config

URL = "https://api.sarvam.ai/translate"

# python.org builds of Python on macOS ship without system CA certificates, so HTTPS via
# urllib fails with CERTIFICATE_VERIFY_FAILED. Use certifi's bundle when it is installed
# (it comes with httpx); otherwise fall back to the platform default.
try:
    import certifi
    _SSL = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL = ssl.create_default_context()


def enabled(lang):
    """True when this language should be generated in English and translated."""
    return bool(config.SARVAM_API_KEY) and (lang or "en").split("-")[0] != "en"


def generation_lang(lang):
    return "en-IN" if enabled(lang) else lang


def _sarvam_code(lang):
    return f"{lang.split('-')[0]}-IN"          # "kn" -> "kn-IN", "hi" -> "hi-IN"


@lru_cache(maxsize=4096)
def _translate(text, lang):
    body = json.dumps({"input": text, "source_language_code": "en-IN",
                       "target_language_code": _sarvam_code(lang),
                       "model": config.SARVAM_MODEL}).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Content-Type": "application/json", "api-subscription-key": config.SARVAM_API_KEY})
    with urllib.request.urlopen(req, timeout=30, context=_SSL) as resp:
        return json.loads(resp.read())["translated_text"]


def translate_result(out, lang):
    """Returns a copy of an answer with each claim translated; other results unchanged."""
    if not enabled(lang) or out.get("type") != "answer":
        return out
    claims = out["claims"]
    try:
        with ThreadPoolExecutor(max_workers=8) as ex:
            texts = list(ex.map(lambda c: _translate(c["text"], lang), claims))
    except Exception as e:
        print(f"    [translate] sarvam failed, keeping English: {str(e)[:120]}")
        return {**out, "language": "en-IN", "translation_failed": True}
    return {**out, "language": lang, "translated_by": f"sarvam / {config.SARVAM_MODEL}",
            "claims": [{**c, "text": t, "text_en": c["text"]} for c, t in zip(claims, texts)]}


# Interface strings (labels, categories, reasons) are translated once and kept on disk,
# so a demo reload costs no Sarvam calls.
_DISK = Path(config.CHROMA_PATH).parent / ".cache" / "translations"
_DISK_LOCK = threading.Lock()
_KNOWN = {}


def _known(lang):
    if lang not in _KNOWN:
        f = _DISK / f"{lang}.json"
        _KNOWN[lang] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    return _KNOWN[lang]


def translate_texts(texts, lang):
    """{text: translation} for every text Sarvam could translate; failures are left out."""
    if not enabled(lang):
        return {}
    with _DISK_LOCK:
        known = _known(lang)
        todo = [t for t in texts if t not in known]

    def one(text):
        try:
            return text, _translate(text, lang)
        except Exception as e:
            print(f"    [translate] sarvam failed for a UI string: {str(e)[:120]}")
            return text, None

    with ThreadPoolExecutor(max_workers=8) as ex:
        done = {t: r for t, r in ex.map(one, todo) if r}
    with _DISK_LOCK:
        known.update(done)
        if done:
            _DISK.mkdir(parents=True, exist_ok=True)
            (_DISK / f"{lang}.json").write_text(json.dumps(known, ensure_ascii=False), encoding="utf-8")
        return {t: known[t] for t in texts if t in known}
