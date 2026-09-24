"""Measures the claims in the design: grounding, refusal, adversarial, flagging, latency.

  python -m ai.evals.run_eval              # all questions
  python -m ai.evals.run_eval --set adversarial
"""
import argparse, csv, statistics, time
from pathlib import Path
from ai.pipeline import answer_question

HERE = Path(__file__).parent


def run(sets=None, limit=None):
    rows = list(csv.DictReader(open(HERE / "questions.csv", encoding="utf-8")))
    if sets:
        rows = [r for r in rows if r["set"] in sets]
    rows = rows[:limit] if limit else rows
    results, times = [], []
    for r in rows:
        t0 = time.time()
        out = answer_question(r["question"], r["city"], r["lang"])
        dt = time.time() - t0
        times.append(dt)
        refused = out["type"] == "refusal"
        ok = refused if r["expected"] == "refuse" else (out["type"] == "answer")
        cited = all(c["source_labels"] for c in out.get("claims", []))
        results.append({**r, "got": out["type"], "layer": out.get("layer", ""),
                        "pass": ok, "cited": cited, "flagged": out.get("flagged", False),
                        "seconds": round(dt, 2)})
        print(f"{'PASS' if ok else 'FAIL'} {r['id']:5s} {r['set']:12s} {out['type']:8s} "
              f"L{out.get('layer','-')} {dt:4.1f}s  {r['question'][:56]}")

    adv = [r for r in results if r["set"] == "adversarial"]
    ind = [r for r in results if r["set"] == "in_domain"]
    print("\n--- summary ---")
    if adv:
        print(f"adversarial refused : {sum(r['pass'] for r in adv)}/{len(adv)}")
    if ind:
        print(f"in-domain answered  : {sum(r['pass'] for r in ind)}/{len(ind)}")
        print(f"claims all cited    : {sum(r['cited'] for r in ind)}/{len(ind)}")
        print(f"low-confidence flags: {sum(r['flagged'] for r in ind)}")
    if times:
        print(f"latency median/max  : {statistics.median(times):.1f}s / {max(times):.1f}s")
    out_file = HERE / "results.csv"
    with open(out_file, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader(); w.writerows(results)
    print(f"saved {out_file}")
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", nargs="*", dest="sets")
    ap.add_argument("--limit", type=int)
    a = ap.parse_args()
    run(a.sets, a.limit)
