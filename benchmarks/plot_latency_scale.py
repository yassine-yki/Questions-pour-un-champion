"""Create a focused latency scaling chart from websocket_load_test results."""

import argparse
import json
from pathlib import Path


def load_points(results_dir: Path, architecture: str):
    points = []
    for path in sorted(results_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("architecture") != architecture:
            continue
        for result in payload.get("results", []):
            points.append(result)
    return sorted(points, key=lambda item: item["clients"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--results-dir", default="benchmarks/results-5000")
    parser.add_argument("--architecture", default="local-memory-scale-5000")
    parser.add_argument("--output", default="latency_scale_5000.png")
    args = parser.parse_args()

    results_dir = Path(args.results_dir)
    points = load_points(results_dir, args.architecture)
    if not points:
        raise SystemExit(f"No results found for architecture {args.architecture}")

    import matplotlib.pyplot as plt

    clients = [p["clients"] for p in points]
    avg = [p["avgLatencyMs"] for p in points]
    p95 = [p["p95LatencyMs"] for p in points]
    failures = [p["failedMessages"] for p in points]

    fig, ax = plt.subplots(figsize=(11, 6.2))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    ax.plot(clients, avg, color="#2563eb", marker="o", linewidth=2.8, label="Average latency")
    ax.plot(clients, p95, color="#f97316", marker="D", linewidth=2.8, label="P95 latency")
    ax.fill_between(clients, avg, color="#2563eb", alpha=0.08)
    ax.fill_between(clients, p95, color="#f97316", alpha=0.08)

    for x, y in zip(clients, avg):
        ax.annotate(f"{y:.1f}", (x, y), xytext=(0, 9), textcoords="offset points",
                    ha="center", fontsize=8.5, color="#2563eb", fontweight="bold")
    for x, y in zip(clients, p95):
        ax.annotate(f"{y:.1f}", (x, y), xytext=(0, 9), textcoords="offset points",
                    ha="center", fontsize=8.5, color="#f97316", fontweight="bold")

    fig.text(
        0.075,
        0.955,
        "WebSocket latency as clients scale to 5000",
        fontsize=18,
        fontweight="bold",
        color="#111827",
    )
    fig.text(
        0.075,
        0.915,
        "Local FastAPI instance, benchPing/benchPong, 5 messages per client",
        fontsize=10,
        color="#4b5563",
    )
    ax.set_xlabel("Concurrent WebSocket clients", color="#4b5563")
    ax.set_ylabel("Latency (ms)", color="#4b5563")
    ax.grid(True, color="#d7dde8", linewidth=0.9, alpha=0.8)
    ax.set_axisbelow(True)
    ax.legend(frameon=True, facecolor="#f8fafc", edgecolor="#9ca3af")

    if any(failures):
        ax2 = ax.twinx()
        ax2.bar(clients, failures, width=[max(20, c * 0.06) for c in clients],
                color="#ef4444", alpha=0.18, label="Failed messages")
        ax2.set_ylabel("Failed messages", color="#ef4444")
        ax2.tick_params(axis="y", colors="#ef4444")

    summary = (
        f"Max tested: {clients[-1]} clients | "
        f"avg {avg[-1]:.1f} ms | p95 {p95[-1]:.1f} ms | "
        f"failed {failures[-1]}"
    )
    fig.text(0.075, 0.035, summary, fontsize=10, color="#4b5563")

    fig.tight_layout(rect=[0.04, 0.08, 0.98, 0.86])
    output_path = results_dir / args.output
    fig.savefig(output_path, dpi=180)
    print(output_path)


if __name__ == "__main__":
    main()
