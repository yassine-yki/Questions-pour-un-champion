"""Generate CSV, Markdown, and optional PNG graphs from benchmark JSON files."""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


METRICS = [
    ("avgLatencyMs", "Average latency (ms)", "latency_avg.png"),
    ("p95LatencyMs", "P95 latency (ms)", "latency_p95.png"),
    ("failedMessages", "Failed messages", "failures.png"),
    ("throughputMessagesPerSecond", "Throughput (messages/s)", "throughput.png"),
]


def load_rows(results_dir: Path) -> List[Dict]:
    rows: List[Dict] = []
    for path in sorted(results_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        architecture = payload.get("architecture", path.stem)
        target = payload.get("target", "")
        created_at = payload.get("createdAt", "")
        for result in payload.get("results", []):
            rows.append({
                "architecture": architecture,
                "target": target,
                "createdAt": created_at,
                **result,
            })
    return rows


def aggregate(rows: List[Dict]) -> List[Dict]:
    grouped: Dict[Tuple[str, int], List[Dict]] = defaultdict(list)
    for row in rows:
        grouped[(row["architecture"], int(row["clients"]))].append(row)

    output = []
    for (architecture, clients), group in sorted(grouped.items()):
        item = {
            "architecture": architecture,
            "clients": clients,
            "runs": len(group),
        }
        for key, _, _ in METRICS:
            item[key] = sum(float(row.get(key, 0)) for row in group) / len(group)
        item["successfulMessages"] = sum(int(row.get("successfulMessages", 0)) for row in group)
        item["attemptedMessages"] = sum(int(row.get("attemptedMessages", 0)) for row in group)
        output.append(item)
    return output


def write_csv(rows: List[Dict], output_dir: Path) -> None:
    if not rows:
        return
    fieldnames = [
        "architecture",
        "clients",
        "runs",
        "avgLatencyMs",
        "p95LatencyMs",
        "failedMessages",
        "throughputMessagesPerSecond",
        "successfulMessages",
        "attemptedMessages",
    ]
    with (output_dir / "summary.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: List[Dict], output_dir: Path) -> None:
    lines = [
        "# Scalability Benchmark Summary",
        "",
        "| Architecture | Clients | Runs | Avg latency ms | P95 latency ms | Failed messages | Throughput msg/s |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for row in rows:
        lines.append(
            "| {architecture} | {clients} | {runs} | {avg:.2f} | {p95:.2f} | {failed:.0f} | {throughput:.2f} |".format(
                architecture=row["architecture"],
                clients=row["clients"],
                runs=row["runs"],
                avg=row["avgLatencyMs"],
                p95=row["p95LatencyMs"],
                failed=row["failedMessages"],
                throughput=row["throughputMessagesPerSecond"],
            )
        )
    lines.extend([
        "",
        "Interpretation notes:",
        "",
        "- Average latency shows the normal response time.",
        "- P95 latency shows the slower edge of the user experience.",
        "- Failed messages expose overload or routing problems.",
        "- Redis Pub/Sub is mainly valuable because it keeps room events consistent across instances.",
    ])
    (output_dir / "summary.md").write_text("\n".join(lines), encoding="utf-8")


def write_graphs(rows: List[Dict], output_dir: Path) -> None:
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib is not installed; wrote CSV and Markdown only.")
        return

    by_architecture: Dict[str, List[Dict]] = defaultdict(list)
    for row in rows:
        by_architecture[row["architecture"]].append(row)

    for metric, label, filename in METRICS:
        fig, ax = plt.subplots(figsize=(8, 4.5))
        for architecture, arch_rows in sorted(by_architecture.items()):
            points = sorted(arch_rows, key=lambda item: item["clients"])
            ax.plot(
                [item["clients"] for item in points],
                [item[metric] for item in points],
                marker="o",
                linewidth=2,
                label=architecture,
            )
        ax.set_xlabel("Concurrent clients")
        ax.set_ylabel(label)
        ax.set_title(label + " vs concurrent clients")
        ax.grid(True, alpha=0.25)
        ax.legend()
        fig.tight_layout()
        fig.savefig(output_dir / filename, dpi=160)
        plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--results-dir", default="benchmarks/results")
    args = parser.parse_args()

    output_dir = Path(args.results_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    rows = aggregate(load_rows(output_dir))
    if not rows:
        print(f"No benchmark JSON files found in {output_dir}")
        return

    write_csv(rows, output_dir)
    write_markdown(rows, output_dir)
    write_graphs(rows, output_dir)
    print(f"Wrote report files in {output_dir}")


if __name__ == "__main__":
    main()
