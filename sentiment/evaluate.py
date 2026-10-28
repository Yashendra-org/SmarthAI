"""Accuracy evaluation for sentiment engines. Pure Python, no extra libraries."""
import csv
from collections import Counter, defaultdict
from pathlib import Path

LABELS = ["positive", "negative", "neutral"]


def load_test_set(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as f:
        return [r for r in csv.DictReader(f) if r["text"].strip()]


def evaluate(engine, rows):
    preds = [engine.analyze(r["text"]) for r in rows]
    gold = [r["label"] for r in rows]
    pred = [p.label for p in preds]
    n = len(rows)
    correct = sum(g == p for g, p in zip(gold, pred))

    matrix = {g: Counter() for g in LABELS}
    for g, p in zip(gold, pred):
        matrix[g][p] += 1

    per_class = {}
    for c in LABELS:
        tp = matrix[c][c]
        fp = sum(matrix[g][c] for g in LABELS if g != c)
        fn = sum(matrix[c][p] for p in LABELS if p != c)
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        per_class[c] = {"precision": prec, "recall": rec, "f1": f1, "support": sum(matrix[c].values())}

    by_type = defaultdict(lambda: [0, 0])
    for r, g, p in zip(rows, gold, pred):
        by_type[r.get("type", "all")][1] += 1
        by_type[r.get("type", "all")][0] += g == p

    mistakes = [(r["text"], g, p.label, p.confidence) for r, g, p in zip(rows, gold, preds) if g != p.label]
    return {
        "engine": engine.name, "n": n, "accuracy": correct / n,
        "macro_f1": sum(v["f1"] for v in per_class.values()) / len(LABELS),
        "per_class": per_class, "matrix": matrix,
        "by_type": {k: (c, t) for k, (c, t) in by_type.items()},
        "mistakes": mistakes,
    }


def to_markdown(results, test_path):
    out = ["# Sentiment Accuracy Report", "",
           f"Test set: `{test_path}`. Labels were assigned by the team, so results show how well the engine "
           "agrees with our own judgement, not a universal measure.", ""]
    out += ["## Summary", "", "| Engine | Comments | Accuracy | Macro F1 |", "|---|---|---|---|"]
    for r in results:
        out.append(f"| {r['engine']} | {r['n']} | {r['accuracy']:.0%} | {r['macro_f1']:.2f} |")
    for r in results:
        out += ["", f"## {r['engine']}", "", "**By comment type**", "", "| Type | Correct | Total | Accuracy |", "|---|---|---|---|"]
        for k, (c, t) in sorted(r["by_type"].items()):
            out.append(f"| {k} | {c} | {t} | {c / t:.0%} |")
        out += ["", "**Per label**", "", "| Label | Precision | Recall | F1 | Support |", "|---|---|---|---|---|"]
        for c in LABELS:
            v = r["per_class"][c]
            out.append(f"| {c} | {v['precision']:.2f} | {v['recall']:.2f} | {v['f1']:.2f} | {v['support']} |")
        out += ["", "**Confusion matrix** (rows = true label, columns = predicted)", "",
                "| True \\ Predicted | positive | negative | neutral |", "|---|---|---|---|"]
        for g in LABELS:
            out.append(f"| {g} | " + " | ".join(str(r["matrix"][g][p]) for p in LABELS) + " |")
        out += ["", f"**Wrong predictions ({len(r['mistakes'])})**", "", "| Comment | True | Predicted | Confidence |", "|---|---|---|---|"]
        for text, g, p, conf in r["mistakes"]:
            out.append(f"| {text} | {g} | {p} | {conf} |")
    return "\n".join(out) + "\n"
