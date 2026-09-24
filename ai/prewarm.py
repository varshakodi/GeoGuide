"""Pre-generate the briefings used in the demo, so the stage path costs no LLM call.

  python -m ai.prewarm                                  # 3 demo cities, en-IN + hi
  python -m ai.prewarm --cities cty_17b8ef2f --langs en-IN hi kn
  python -m ai.prewarm --clear
"""
import argparse, time
from backend import data_queries as dq
from ai import cache
from ai.briefing import build

DEMO = ["cty_17b8ef2f", "cty_718f03c7", "cty_621f4a84", "cty_95e7c8ca"]


def warm(cities, langs, dates=None):
    from backend.ai_routes import briefing_context, default_date, city_name
    dates = dates or [default_date()]
    for city_id in cities:
        name = city_name(city_id)
        for d in dates:
          ctx, *_ = briefing_context(city_id, name, d)
          today = d
          for lang in langs:
            try:
              t0 = time.time()
              out = build(city_id, name, today, ctx, lang)
              bad = [k for k, v in out.items() if v.get("type") != "answer"]
              cached = all(v.get("cached") for v in out.values())
              print(f"{name:12s} {today} {lang:6s} {time.time()-t0:5.1f}s "
                    f"{'(from cache)' if cached else '(generated)'}"
                    f"{'  PROBLEM: ' + ', '.join(bad) if bad else ''}", flush=True)
            except Exception as e:                    # keep going; re-run resumes from the cache
              print(f"{name:12s} {today} {lang:6s} FAILED {str(e)[:90]}", flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--cities", nargs="*", default=DEMO)
    ap.add_argument("--langs", nargs="*", default=["en-IN", "hi"])
    ap.add_argument("--dates", nargs="*", help="dates to prewarm, e.g. 2026-09-24 2026-10-17")
    ap.add_argument("--all-dates", action="store_true",
                    help="every date the dataset covers, so any judge-chosen date is instant")
    ap.add_argument("--clear", action="store_true")
    a = ap.parse_args()
    if a.clear:
        print(f"cleared {cache.clear()} cached briefings")
    else:
        dates = a.dates
        if a.all_dates:
            from datetime import date as _d, timedelta
            from backend import data_queries as dq
            rng = dq.date_range(a.cities[0])
            lo, hi = _d.fromisoformat(rng["min"]), _d.fromisoformat(rng["max"])
            dates = [(lo + timedelta(days=i)).isoformat() for i in range((hi - lo).days + 1)]
            print(f"prewarming {len(dates)} dates x {len(a.cities)} cities x {len(a.langs)} languages "
                  f"= {len(dates) * len(a.cities) * len(a.langs)} briefings (cached ones are skipped)")
        warm(a.cities, a.langs, dates)
