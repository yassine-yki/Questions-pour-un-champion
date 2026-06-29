"""Generate CSV, Markdown, and optional PNG graphs from benchmark JSON files."""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


METRICS = [
    ("avgLatencyMs", "Average latency", "Round-trip response time", "ms", "latency_avg.png"),
    ("p95LatencyMs", "P95 latency", "Slowest 5% user experience", "ms", "latency_p95.png"),
    ("failedMessages", "Failed messages", "Reliability under load", "messages", "failures.png"),
    ("throughputMessagesPerSecond", "Throughput", "Messages processed per second", "msg/s", "throughput.png"),
]

DISPLAY_NAMES = {
    "memory-single": "Memory only - local",
    "online-memory": "Online - no Redis",
    "online-redis": "Online - Redis",
    "redis-pubsub": "Redis Pub/Sub",
    "redis-pubsub-render": "Redis Pub/Sub - Render",
}

SERIES_STYLES = {
    "memory-single": {"color": "#38bdf8", "marker": "o"},
    "online-memory": {"color": "#fb7185", "marker": "o"},
    "online-redis": {"color": "#22c55e", "marker": "D"},
    "redis-pubsub": {"color": "#a78bfa", "marker": "D"},
    "redis-pubsub-render": {"color": "#a78bfa", "marker": "D"},
}

THEME = {
    "figure": "#ffffff",
    "axes": "#ffffff",
    "axes_2": "#f8fafc",
    "grid": "#d7dde8",
    "text": "#111827",
    "muted": "#4b5563",
    "spine": "#9ca3af",
    "accent": "#2563eb",
}


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
        for key, _, _, _, _ in METRICS:
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


def display_name(architecture: str) -> str:
    return DISPLAY_NAMES.get(architecture, architecture)


def format_value(value: float, unit: str) -> str:
    if unit == "messages":
        return f"{value:.0f}"
    if unit == "msg/s":
        return f"{value:,.0f}"
    return f"{value:.1f}"


def grouped_rows(rows: List[Dict]) -> Dict[str, List[Dict]]:
    by_architecture: Dict[str, List[Dict]] = defaultdict(list)
    for row in rows:
        by_architecture[row["architecture"]].append(row)
    return by_architecture


def style_axis(ax, title: str, subtitle: str, unit: str) -> None:
    ax.set_facecolor(THEME["axes"])
    for spine in ax.spines.values():
        spine.set_color(THEME["spine"])
        spine.set_linewidth(1.0)
    ax.grid(True, color=THEME["grid"], alpha=0.7, linewidth=0.85)
    ax.tick_params(colors=THEME["muted"], labelsize=10)
    ax.set_xlabel("Concurrent WebSocket clients", color=THEME["muted"], labelpad=10)
    ax.set_ylabel(unit, color=THEME["muted"], labelpad=10)
    ax.set_title(title, color=THEME["text"], loc="left", fontsize=15, fontweight="bold", pad=16)
    ax.text(
        0,
        1.02,
        subtitle,
        transform=ax.transAxes,
        color=THEME["muted"],
        fontsize=9,
        va="bottom",
    )


def draw_metric(ax, rows: List[Dict], metric: str, title: str, subtitle: str, unit: str) -> None:
    by_architecture = grouped_rows(rows)
    style_axis(ax, title, subtitle, unit)
    all_metric_values = [float(row.get(metric, 0)) for row in rows]
    zero_failure_chart = metric == "failedMessages" and all_metric_values and max(all_metric_values) == 0

    all_values = []
    for architecture, arch_rows in sorted(by_architecture.items()):
        points = sorted(arch_rows, key=lambda item: item["clients"])
        xs = [item["clients"] for item in points]
        ys = [item[metric] for item in points]
        all_values.extend(ys)
        style = SERIES_STYLES.get(architecture, {"color": "#f97316", "marker": "o"})
        color = style["color"]
        ax.plot(
            xs,
            ys,
            color=color,
            marker=style["marker"],
            markersize=8,
            markeredgecolor=THEME["figure"],
            markeredgewidth=1.5,
            linewidth=3,
            label=display_name(architecture),
        )
        ax.fill_between(xs, ys, [0 for _ in ys], color=color, alpha=0.07)

        if not zero_failure_chart:
            for x, y in zip(xs, ys):
                ax.annotate(
                    format_value(y, unit),
                    xy=(x, y),
                    xytext=(0, 10),
                    textcoords="offset points",
                    ha="center",
                    color=color,
                    fontsize=8.5,
                    fontweight="bold",
                )

        if xs and ys and not zero_failure_chart:
            ax.annotate(
                display_name(architecture),
                xy=(xs[-1], ys[-1]),
                xytext=(12, 0),
                textcoords="offset points",
                va="center",
                color=color,
                fontsize=9.5,
                fontweight="bold",
            )

    ax.margins(x=0.12)
    if zero_failure_chart:
        ax.set_ylim(-0.1, 1)
        ax.set_yticks([0, 1])
        ax.text(
            0.5,
            0.55,
            "0 failed messages",
            transform=ax.transAxes,
            ha="center",
            va="center",
            color=THEME["text"],
            fontsize=18,
            fontweight="bold",
        )
        ax.text(
            0.5,
            0.43,
            "All benchmark messages completed successfully",
            transform=ax.transAxes,
            ha="center",
            va="center",
            color=THEME["muted"],
            fontsize=9,
        )
    elif all_values:
        max_value = max(all_values)
        min_value = min(all_values)
        if max_value == min_value:
            pad = 1 if max_value == 0 else max_value * 0.2
            ax.set_ylim(max(0, min_value - pad), max_value + pad)
        else:
            ax.set_ylim(max(0, min_value - (max_value - min_value) * 0.15), max_value * 1.22)

    legend = ax.legend(
        loc="upper left",
        frameon=True,
        facecolor=THEME["axes_2"],
        edgecolor=THEME["spine"],
        fontsize=9.5,
    )
    for text in legend.get_texts():
        text.set_color(THEME["text"])


def write_graphs(rows: List[Dict], output_dir: Path) -> None:
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib is not installed; wrote CSV and Markdown only.")
        return

    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "figure.facecolor": THEME["figure"],
        "savefig.facecolor": THEME["figure"],
        "axes.facecolor": THEME["axes"],
        "axes.labelcolor": THEME["muted"],
        "xtick.color": THEME["muted"],
        "ytick.color": THEME["muted"],
    })

    for metric, title, subtitle, unit, filename in METRICS:
        fig, ax = plt.subplots(figsize=(9, 5.2))
        draw_metric(ax, rows, metric, title, subtitle, unit)
        fig.text(
            0.075,
            0.965,
            "Questions pour un champion: online scalability benchmark",
            color=THEME["text"],
            fontsize=15,
            fontweight="bold",
        )
        fig.text(
            0.075,
            0.925,
            "Render WebSocket tests only. Compare the same deployed app without Redis and with Redis.",
            color=THEME["muted"],
            fontsize=9,
        )
        fig.text(
            0.965,
            0.035,
            "Generated from benchPing/benchPong",
            color=THEME["muted"],
            fontsize=8,
            ha="right",
        )
        fig.tight_layout(rect=[0.06, 0.075, 0.97, 0.87])
        fig.savefig(output_dir / filename, dpi=180)
        plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(13, 8))
    for ax, (metric, title, subtitle, unit, _) in zip(axes.flatten(), METRICS):
        draw_metric(ax, rows, metric, title, subtitle, unit)
    fig.text(
        0.05,
        0.965,
        "Online scalability benchmark dashboard",
        color=THEME["text"],
        fontsize=18,
        fontweight="bold",
    )
    fig.text(
        0.05,
        0.925,
        "Same Render app benchmarked without Redis and with Redis",
        color=THEME["muted"],
        fontsize=9,
    )
    fig.text(
        0.965,
        0.025,
        "Redis Pub/Sub is mainly about shared room state and cross-instance event delivery.",
        color=THEME["muted"],
        fontsize=8,
        ha="right",
    )
    fig.tight_layout(rect=[0.035, 0.055, 0.985, 0.895])
    fig.savefig(output_dir / "dashboard.png", dpi=180)
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
