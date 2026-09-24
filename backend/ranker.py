"""Contextual Action Engine — what to do in the next 90 minutes.

Deterministic and reproducible: no model is involved. Every pick carries at least two
reasons, and each reason names the field it came from, so a recommendation is as
traceable as a briefing claim.
"""
from datetime import datetime, timedelta
from decimal import Decimal

WINDOW_MIN = 90
WALK_KMH = 12.0          # rough mixed walking/auto speed for travel-time estimates


def _mins(hhmm):
    h, m = str(hhmm).split(":")[:2]
    return int(h) * 60 + int(m)


def why_not(p, now_hhmm, window=WINDOW_MIN, budget=None):
    """Why a place did not make the list, in the data's own terms.

    An empty list is often the correct answer — at 21:00 nothing in the city is open.
    Saying which field ruled each place out keeps that honest instead of looking broken.
    """
    now = _mins(now_hhmm)
    if p.get("closed_today"):
        return "closed today (activities_poi.closed_days)"
    opens = _mins(p["opens_at"]) if p.get("opens_at") else 0
    closes = _mins(p["closes_at"]) if p.get("closes_at") else 24 * 60
    travel = int(round(p["distance_km"] / WALK_KMH * 60))
    arrive = now + travel
    if arrive >= closes:
        return f"closes at {p['closes_at']} (activities_poi.closes_at)"
    if arrive < opens:
        return f"opens at {p['opens_at']} (activities_poi.opens_at)"
    stay = int(p["typical_duration_minutes"] or 60)
    if arrive + min(stay, window - travel) > closes:
        return f"needs {stay} min but closes at {p['closes_at']}"
    if travel + 20 > window:
        return f"{travel} min away, too far for a {window}-minute window"
    if budget is not None and Decimal(str(p["entry_cost"])) > Decimal(str(budget)):
        return f"entry {p['currency']} {p['entry_cost']} is over the budget"
    return "not in the top picks"


def opens_earliest(pois, limit=3):
    """What opens first tomorrow — the useful next step when nothing is open now."""
    out = [p for p in pois if p.get("opens_at") and not p.get("closed_today")]
    out.sort(key=lambda p: (_mins(p["opens_at"]), p["distance_km"]))
    return [{"poi_id": p["poi_id"], "name": p["name"], "opens_at": p["opens_at"],
             "closes_at": p["closes_at"], "distance_km": p["distance_km"],
             "entry_cost": p["entry_cost"], "currency": p["currency"],
             "source_label": "activities_poi"} for p in out[:limit]]


def rank(pois, now_hhmm, for_date, budget=None, currency="INR", window=WINDOW_MIN, limit=3):
    now = _mins(now_hhmm)
    out = []
    for p in pois:
        if p.get("closed_today"):
            continue
        opens = _mins(p["opens_at"]) if p.get("opens_at") else 0
        closes = _mins(p["closes_at"]) if p.get("closes_at") else 24 * 60      # null = open-ended
        travel = int(round(p["distance_km"] / WALK_KMH * 60))
        arrive = now + travel
        stay = int(p["typical_duration_minutes"] or 60)
        if arrive < opens or arrive >= closes:
            continue
        if arrive + min(stay, window - travel) > closes:
            continue
        if travel + 20 > window:
            continue
        cost = Decimal(str(p["entry_cost"]))
        if budget is not None and cost > Decimal(str(budget)):
            continue

        fits = max(0.0, 1 - travel / window)
        near = max(0.0, 1 - p["distance_km"] / 10)
        cheap = 1.0 if cost == 0 else max(0.0, 1 - float(cost) / 2500)
        score = round(0.45 * near + 0.35 * fits + 0.20 * cheap, 4)

        reasons = [f"{p['distance_km']} km away, about {travel} min to reach (activities_poi.lat/lng)"]
        reasons.append(f"open until {p['closes_at']} (activities_poi.closes_at)" if p.get("closes_at")
                       else "no closing time recorded (activities_poi.closes_at)")
        reasons.append(f"takes about {stay} min, fits the {window}-minute window "
                       f"(activities_poi.typical_duration_minutes)" if travel + stay <= window
                       else f"takes about {stay} min, about {window - travel} min of it fits the "
                            f"{window}-minute window (activities_poi.typical_duration_minutes)")
        reasons.append("free entry (activities_poi.entry_cost)" if cost == 0
                       else f"entry {p['currency']} {p['entry_cost']} (activities_poi.entry_cost)")
        if budget is not None:
            reasons.append(f"within your {currency} {budget} budget (user_preferences.max_daily_budget)")
        out.append({"poi_id": p["poi_id"], "name": p["name"], "category": p["poi_category"],
                    "distance_km": p["distance_km"], "travel_minutes": travel,
                    "opens_at": p["opens_at"], "closes_at": p["closes_at"],
                    "entry_cost": p["entry_cost"], "currency": p["currency"],
                    "duration_minutes": stay, "score": score, "reasons": reasons,
                    "source_label": "activities_poi"})
    out.sort(key=lambda d: d["score"], reverse=True)
    return out[:limit]
