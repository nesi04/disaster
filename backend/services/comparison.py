"""
Cross-model comparison. Works for any number of models (2 today, 4 later):
pairwise differences, agreement, a consensus severity, and plain-language
findings the UI and the AI assistant can both use.
"""

from __future__ import annotations

from itertools import combinations
from typing import Dict, List

from services.model_registry import (
    DAMAGE_CLASSES,
    severity_from_distribution,
    severity_label,
)

LABEL_RANK = {"no-damage": 0, "minor-damage": 1, "major-damage": 2, "destroyed": 3}


def _pretty(label: str | None) -> str:
    return label.replace("-", " ") if label else "nothing"


def compare_results(results: Dict[str, Dict]) -> Dict:
    ok = {mid: r for mid, r in results.items() if r.get("success")}

    if not ok:
        return {
            "models_compared": [],
            "agreement": "none",
            "label_agreement": False,
            "consensus_label": None,
            "consensus_severity": None,
            "consensus_level": "unknown",
            "severity_spread": None,
            "pairwise": [],
            "class_differences": [],
            "findings": ["No model produced a result."],
        }

    # Consensus = average of each model's distribution
    avg_dist = {
        c: sum(r["distribution"].get(c, 0.0) for r in ok.values()) / len(ok)
        for c in DAMAGE_CLASSES
    }
    consensus_severity = severity_from_distribution(avg_dist)
    consensus_label = max(DAMAGE_CLASSES, key=lambda c: avg_dist[c])

    labels = {mid: r.get("overall_label") for mid, r in ok.items()}
    label_agreement = len(set(labels.values())) == 1

    severities = [r["severity_score"] for r in ok.values() if r["severity_score"] is not None]
    spread = round(max(severities) - min(severities), 1) if len(severities) > 1 else 0.0

    # Pairwise comparison
    pairwise: List[Dict] = []
    for a, b in combinations(ok.keys(), 2):
        ra, rb = ok[a], ok[b]
        # Total variation distance between distributions (0 = identical, 1 = disjoint)
        tvd = 0.5 * sum(abs(ra["distribution"][c] - rb["distribution"][c]) for c in DAMAGE_CLASSES)
        rank_a = LABEL_RANK.get(ra.get("overall_label"))
        rank_b = LABEL_RANK.get(rb.get("overall_label"))
        pairwise.append({
            "models": [a, b],
            "same_label": ra.get("overall_label") == rb.get("overall_label"),
            "label_gap": abs(rank_a - rank_b) if rank_a is not None and rank_b is not None else None,
            "severity_gap": (
                round(abs(ra["severity_score"] - rb["severity_score"]), 1)
                if ra["severity_score"] is not None and rb["severity_score"] is not None
                else None
            ),
            "distribution_distance": round(tvd, 3),
        })

    # Per-class spread (biggest disagreement first)
    class_diffs = []
    for c in DAMAGE_CLASSES:
        values = {mid: round(r["distribution"].get(c, 0.0), 3) for mid, r in ok.items()}
        class_diffs.append({
            "class": c,
            "values": values,
            "spread": round(max(values.values()) - min(values.values()), 3),
        })
    class_diffs.sort(key=lambda d: d["spread"], reverse=True)

    # Agreement level
    max_tvd = max((p["distribution_distance"] for p in pairwise), default=0.0)
    if len(ok) == 1:
        agreement = "single-model"
    elif label_agreement and spread < 15 and max_tvd < 0.25:
        agreement = "high"
    elif spread < 35 and max_tvd < 0.5:
        agreement = "medium"
    else:
        agreement = "low"

    # Plain-language findings
    findings: List[str] = []
    names = {mid: r["display_name"] for mid, r in ok.items()}
    if len(ok) > 1:
        if label_agreement:
            findings.append(
                f"All models agree the dominant damage class is {_pretty(consensus_label)}."
            )
        else:
            parts = ", ".join(f"{names[m]} → {_pretty(l)}" for m, l in labels.items())
            findings.append(f"Models disagree on the dominant damage class ({parts}).")

        if severities:
            hi = max(ok.values(), key=lambda r: r["severity_score"] or 0)
            lo = min(ok.values(), key=lambda r: r["severity_score"] or 0)
            if spread >= 15:
                findings.append(
                    f"{hi['display_name']} rates the scene more severe "
                    f"({hi['severity_score']}/100) than {lo['display_name']} ({lo['severity_score']}/100)."
                )

        top = class_diffs[0]
        if top["spread"] >= 0.2:
            findings.append(
                f"Largest disagreement is on '{_pretty(top['class'])}' "
                f"(share differs by {round(top['spread'] * 100)} percentage points)."
            )

        tasks = {r["task"] for r in ok.values()}
        if "classification" in tasks and len(tasks) > 1:
            findings.append(
                "Note: classifiers label the whole image while detectors count individual "
                "buildings, so some disagreement is expected on mixed-damage scenes."
            )

    for r in ok.values():
        if r["task"] in ("detection", "segmentation") and r.get("total_objects") == 0:
            findings.append(f"{r['display_name']} found no buildings — try a lower confidence threshold.")
        if r["task"] == "classification" and (r.get("overall_confidence") or 0) < 0.5:
            findings.append(f"{r['display_name']} is uncertain (top-class confidence below 50%).")

    failed = [r["display_name"] for r in results.values() if not r.get("success")]
    if failed:
        findings.append(f"Not included: {', '.join(failed)}.")

    return {
        "models_compared": list(ok.keys()),
        "agreement": agreement,
        "label_agreement": label_agreement,
        "consensus_label": consensus_label,
        "consensus_distribution": {c: round(v, 3) for c, v in avg_dist.items()},
        "consensus_severity": consensus_severity,
        "consensus_level": severity_label(consensus_severity),
        "severity_spread": spread,
        "pairwise": pairwise,
        "class_differences": class_diffs,
        "findings": findings,
    }
