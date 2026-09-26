# Refusal specification — GeoGuide

Status: DRAFT, finalised in the sprint · Inputs: `docs/calibration.md`, `spikes/calibration/questions.csv`

GeoGuide either answers from a cited source or declines. Refusal is not one check but three layers plus a final citation check. Each refusal records **which layer fired and why**, so the evaluation can count them and the demo can show them.

## Order of checks (for `/ask`; briefing sections use steps 2–5)

| Step | Check | On failure | LLM called? |
|---|---|---|---|
| 1 | **Layer 3 — unsupported intent.** Question matches a pattern in the table below. | Refuse with the "live data" or "general" message | No |
| 2 | **Layer 1 — relevance gate.** Retrieve top-k with the city filter. Top-1 cosine similarity < `RELEVANCE_THRESHOLD`, or zero hits. | Refuse, general message | No |
| 3 | Generate from the numbered passages only (prompt in `docs/prompt-notes.md`). | — | Yes |
| 4 | **Layer 2 — sentinel.** Reply equals or contains `INSUFFICIENT_GROUNDED_INFORMATION`. | Refuse, general message | Already called |
| 5 | **Citation check.** Drop every sentence without a valid `[n]` (n within the passage count). If nothing is left, refuse. | Refuse, general message | Already called |

Layer 3 runs first because the calibration shows some unanswerable questions retrieve *well*. For example, a cab-fare question lands near the transport chunk. The threshold alone cannot catch these.

**Grounding-OFF demo switch:** retrieval returns nothing, so Layer 1 refuses every question. This proves the model is never answering from its own knowledge.

## Layer 3 — unsupported intents

A question is blocked only when it matches a category rule. Word lists are matched case-insensitively on word boundaries; Hindi terms are matched as substrings.

| Category | Rule | English terms | Hindi terms |
|---|---|---|---|
| `live_price` | a PRICE word **and** (a TRANSPORT word **or** a NOW word) | price: fare, cost, price, charge, how much · transport: cab, taxi, uber, ola, auto, rickshaw, flight, train, bus, metro · now: right now, now, today, tonight, currently, at the moment, live | price: किराया, कीमत, दाम, कितना, कितने · now: अभी, आज, इस समय, आज रात |
| `exchange_rate` | any term | exchange rate, forex, fx, usd, dollar, euro, pound, conversion rate | डॉलर, विनिमय, एक्सचेंज रेट, रुपये का रेट, यूरो |
| `realtime_status` | any term | traffic, running now, last metro, last train, delay, delayed, queue, crowd right now, news, live score | ट्रैफ़िक, ट्रैफिक, जाम, आखिरी मेट्रो, देरी, खबर, समाचार |
| `booking_payment` | any term | book, booking, reserve, reservation, pay, payment, card, upi, checkout for me | बुक, बुकिंग, आरक्षण, भुगतान, पेमेंट |
| `specific_person` | any term | who is the, phone number, contact number, mobile number, email of, mayor, minister, commissioner | कौन है, फ़ोन नंबर, मोबाइल नंबर, मेयर, मंत्री |
| `prompt_injection` | any term | ignore your rules, ignore previous, ignore all instructions, pretend, jailbreak, just guess, make something up, not in your data | नियम भूल, नियम छोड़, अंदाज़ा लगाओ, कुछ भी बता दो |

### Must NOT be blocked (false-positive checks)

These are answerable from the data and must reach retrieval. Keep them in the test set.

- "Is Bengaluru Bazaar open now?" (hours are in `activities_poi`). Note that "now" alone never triggers; `live_price` needs a PRICE word as well.
- "How much is entry to Bengaluru Viewpoint?" (`entry_cost` is in the data; no transport or now word).
- "What's the best way to get around under 3 km?" (transport word without a price word).
- "When is street food safest?" (no category term).

Rule of thumb: add a term only if a real test question needs it, and re-run the false-positive list after every change.

## Refusal messages (DRAFT — fluent speakers must check hi and kn)

| Key | en-IN | hi | kn |
|---|---|---|---|
| `general` | I don't have grounded information for this, so I won't guess. | इस बारे में मेरे पास प्रमाणित जानकारी नहीं है, इसलिए मैं अंदाज़ा नहीं लगाऊँगा। | ಇದರ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ಆಧಾರಿತ ಮಾಹಿತಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ. |
| `live_data` | I don't have live data such as fares, exchange rates or traffic, so I won't guess. | मेरे पास किराया, विनिमय दर या ट्रैफ़िक जैसी लाइव जानकारी नहीं है, इसलिए मैं अंदाज़ा नहीं लगाऊँगा। | ದರ, ವಿನಿಮಯ ದರ ಅಥವಾ ಟ್ರಾಫಿಕ್‌ನಂತಹ ನೇರ ಮಾಹಿತಿ ನನ್ನ ಬಳಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ. |
| `booking` | I can show hotels and places, but I can't book or pay for anything. | मैं होटल और जगहें दिखा सकता हूँ, लेकिन बुकिंग या भुगतान नहीं कर सकता। | ನಾನು ಹೋಟೆಲ್‌ಗಳು ಮತ್ತು ಸ್ಥಳಗಳನ್ನು ತೋರಿಸಬಲ್ಲೆ, ಆದರೆ ಬುಕಿಂಗ್ ಅಥವಾ ಪಾವತಿ ಮಾಡಲಾರೆ. |

Notes for the checker: the Hindi verbs (लगाऊँगा, सकता) are grammatically masculine. Decide whether to keep them or rephrase neutrally, for example "…इसलिए अंदाज़ा लगाना ठीक नहीं होगा।" Hand the final text to Vachana for `web/src/i18n/`.

Mapping: `live_price`, `exchange_rate`, `realtime_status` → `live_data`; `booking_payment` → `booking`; everything else → `general`.

## What each refusal returns (for the API contract)

```json
{ "type": "refusal", "layer": 3, "reason": "live_price", "message_key": "live_data", "language": "en-IN" }
```

## Known design issue to fix

The design's Ask screen shows "Namma Metro covers the main axes" cited as KV Guide / transport. **The transport chunk never mentions the metro.** Do not use that line in the demo; ask a question the transport chunk actually answers, such as the best mode under 3 km.

## Tests

- `spikes/calibration/questions.csv`: 17 adversarial questions (15 English, 2 Hindi). Every one must refuse, and the layer that fired is recorded.
- The false-positive list above must all pass through to retrieval.
- Target (design Sec 7): 100% refusal on the adversarial set, 0 false positives on the list above.
