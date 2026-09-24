"""Refusal: layer 3 (unsupported intent), plus the message catalogue.

Layer 1 is the relevance gate in retrieval.py; layer 2 is the sentinel check in
pipeline.py. Layer 3 runs FIRST because some unanswerable questions retrieve well:
a cab-fare question sits close to the transport chunk and clears any usable threshold.
"""
import re

PRICE = r"(fare|fares|cost|costs|price|prices|charge|charges|how much|kitna|किराया|कीमत|दाम|कितना|कितने)"
TRANSPORT = r"(cab|taxi|uber|ola|auto|rickshaw|flight|train|bus|metro|कैब|टैक्सी|ऑटो|मेट्रो)"
NOW = r"(right now|now|today|tonight|currently|at the moment|live|अभी|आज|इस समय|आज रात)"

RULES = [
    ("live_price", lambda q: re.search(PRICE, q) and (re.search(TRANSPORT, q) or re.search(NOW, q))),
    ("exchange_rate", lambda q: re.search(r"(exchange rate|forex|\bfx\b|\busd\b|dollar|euro|pound|conversion rate|डॉलर|विनिमय|एक्सचेंज रेट|यूरो)", q)),
    ("realtime_status", lambda q: re.search(r"(traffic|running now|last metro|last train|delayed|delay|queue|latest news|news today|live score|ट्रैफ़िक|ट्रैफिक|जाम|आखिरी मेट्रो|देरी|खबर|समाचार)", q)),
    ("booking_payment", lambda q: re.search(r"(book me|book a|booking|reserve|reservation|pay my|payment|my card|\bupi\b|बुक|बुकिंग|आरक्षण|भुगतान|पेमेंट)", q)),
    ("specific_person", lambda q: re.search(r"(who is the|phone number|contact number|mobile number|email of|mayor|minister|commissioner|कौन है|फ़ोन नंबर|मोबाइल नंबर|मेयर|मंत्री)", q)),
    ("prompt_injection", lambda q: re.search(r"(ignore (your|previous|all|the) (rules|instructions)|pretend you|jailbreak|just guess|make something up|not in your data|नियम भूल|नियम छोड़|अंदाज़ा लगाओ)", q)),
]

MESSAGE_KEY = {"live_price": "live_data", "exchange_rate": "live_data", "realtime_status": "live_data",
               "booking_payment": "booking"}

MESSAGES = {
    "general": {
        "en-IN": "I don't have grounded information for this, so I won't guess.",
        "hi": "इस बारे में मेरे पास प्रमाणित जानकारी नहीं है, इसलिए मैं अंदाज़ा नहीं लगाऊँगा।",
        "kn": "ಇದರ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ಆಧಾರಿತ ಮಾಹಿತಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ.",
    },
    "live_data": {
        "en-IN": "I don't have live data such as fares, exchange rates or traffic, so I won't guess.",
        "hi": "मेरे पास किराया, विनिमय दर या ट्रैफ़िक जैसी लाइव जानकारी नहीं है, इसलिए मैं अंदाज़ा नहीं लगाऊँगा।",
        "kn": "ದರ, ವಿನಿಮಯ ದರ ಅಥವಾ ಟ್ರಾಫಿಕ್‌ನಂತಹ ನೇರ ಮಾಹಿತಿ ನನ್ನ ಬಳಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ.",
    },
    "booking": {
        "en-IN": "I can show hotels and places, but I can't book or pay for anything.",
        "hi": "मैं होटल और जगहें दिखा सकता हूँ, लेकिन बुकिंग या भुगतान नहीं कर सकता।",
        "kn": "ನಾನು ಹೋಟೆಲ್‌ಗಳು ಮತ್ತು ಸ್ಥಳಗಳನ್ನು ತೋರಿಸಬಲ್ಲೆ, ಆದರೆ ಬುಕಿಂಗ್ ಅಥವಾ ಪಾವತಿ ಮಾಡಲಾರೆ.",
    },
}


def check_intent(question):
    """Layer 3. Returns a reason string, or None if the question may proceed."""
    q = question.lower()
    for reason, test in RULES:
        if test(q):
            return reason
    return None


def message(key, lang):
    return MESSAGES.get(key, MESSAGES["general"]).get(lang, MESSAGES[key]["en-IN"])


def refusal(layer, reason, lang="en-IN"):
    key = MESSAGE_KEY.get(reason, "general")
    return {"type": "refusal", "layer": layer, "reason": reason,
            "message_key": key, "message": message(key, lang), "language": lang}
