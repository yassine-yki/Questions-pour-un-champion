"""Latency benchmark for single-instance vs Redis-enabled load-balanced setup.

This benchmark is for the scalability presentation:

- Baseline: one FastAPI instance, no Redis.
- Scaled: four FastAPI instances with Redis enabled, clients distributed with
  sticky round-robin assignment.

The measured operation is benchPing/benchPong, so the chart isolates WebSocket
response latency as concurrent clients increase.
"""

import argparse
import asyncio
import json
import math
import os
import signal
import statistics
import subprocess
import sys
import time
import uuid
from pathlib import Path
from typing import Dict, List
from urllib.request import urlopen

import websockets


def percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, math.ceil((pct / 100) * len(ordered)) - 1))
    return ordered[index]


def http_json(url: str, timeout: float = 2.0) -> Dict:
    with urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def start_instance(port: int, instance_id: str, redis_url: str | None, log_dir: Path) -> subprocess.Popen:
    env = os.environ.copy()
    env["INSTANCE_ID"] = instance_id
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    if redis_url:
        env["REDIS_URL"] = redis_url
    else:
        env.pop("REDIS_URL", None)
        env.pop("RENDER_REDIS_URL", None)

    log_dir.mkdir(parents=True, exist_ok=True)
    log = (log_dir / f"{instance_id}.log").open("w", encoding="utf-8")
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)],
        stdout=log,
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
    )


def wait_for_instance(port: int, expected_redis: bool, timeout: float = 30.0) -> None:
    started = time.perf_counter()
    while time.perf_counter() - started < timeout:
        try:
            health = http_json(f"http://127.0.0.1:{port}/api/health")
            if health.get("redis", {}).get("enabled") == expected_redis:
                return
        except Exception:
            pass
        time.sleep(0.35)
    raise RuntimeError(f"Instance on port {port} did not become ready")


def stop_processes(processes: List[subprocess.Popen]) -> None:
    for process in processes:
        if process.poll() is None:
            try:
                if os.name == "nt":
                    process.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    process.terminate()
            except Exception:
                process.terminate()
    time.sleep(1)
    for process in processes:
        if process.poll() is None:
            process.kill()


async def read_until_pong(ws, timeout: float):
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        msg = json.loads(raw)
        if msg.get("event") == "benchPong":
            return msg


async def client_worker(url: str, client_id: str, messages: int, timeout: float, delay: float, work_ms: float) -> Dict:
    latencies: List[float] = []
    failures = 0
    instances: Dict[str, int] = {}

    try:
        async with websockets.connect(url, ping_interval=20, ping_timeout=20, open_timeout=timeout) as ws:
            for seq in range(messages):
                sent_ns = time.perf_counter_ns()
                await ws.send(json.dumps({
                    "action": "benchPing",
                    "sentAt": sent_ns,
                    "clientId": client_id,
                    "seq": seq,
                    "workMs": work_ms,
                }))
                try:
                    msg = await read_until_pong(ws, timeout)
                    latency_ms = (time.perf_counter_ns() - sent_ns) / 1_000_000
                    latencies.append(latency_ms)
                    instance_id = (msg.get("data") or {}).get("instanceId")
                    if instance_id:
                        instances[instance_id] = instances.get(instance_id, 0) + 1
                except Exception:
                    failures += 1
                if delay > 0:
                    await asyncio.sleep(delay)
    except Exception:
        failures += messages

    return {
        "clientId": client_id,
        "latenciesMs": latencies,
        "failures": failures,
        "instances": instances,
    }


async def run_client_step(urls: List[str], clients: int, messages: int, timeout: float, delay: float, work_ms: float) -> Dict:
    started = time.perf_counter()
    workers = [
        client_worker(
            urls[index % len(urls)],
            f"client-{clients}-{index}",
            messages,
            timeout,
            delay,
            work_ms,
        )
        for index in range(clients)
    ]
    client_results = await asyncio.gather(*workers)
    duration_seconds = time.perf_counter() - started

    latencies = [latency for result in client_results for latency in result["latenciesMs"]]
    failures = sum(result["failures"] for result in client_results)
    attempted = clients * messages
    instance_hits: Dict[str, int] = {}
    for result in client_results:
        for instance_id, count in result["instances"].items():
            instance_hits[instance_id] = instance_hits.get(instance_id, 0) + count

    return {
        "clients": clients,
        "messagesPerClient": messages,
        "attemptedMessages": attempted,
        "successfulMessages": len(latencies),
        "failedMessages": failures,
        "failureRate": failures / attempted if attempted else 0,
        "durationSeconds": duration_seconds,
        "throughputMessagesPerSecond": len(latencies) / duration_seconds if duration_seconds else 0,
        "avgLatencyMs": statistics.mean(latencies) if latencies else 0,
        "medianLatencyMs": statistics.median(latencies) if latencies else 0,
        "p95LatencyMs": percentile(latencies, 95),
        "maxLatencyMs": max(latencies) if latencies else 0,
        "instanceHits": instance_hits,
    }


async def run_architecture(
    label: str,
    ports: List[int],
    redis_url: str | None,
    clients: List[int],
    messages: int,
    timeout: float,
    delay: float,
    work_ms: float,
    output_dir: Path,
) -> Dict:
    uses_redis = bool(redis_url)
    log_dir = output_dir / "logs" / label
    processes = [
        start_instance(port, f"{label}-{index + 1}", redis_url, log_dir)
        for index, port in enumerate(ports)
    ]
    try:
        for port in ports:
            wait_for_instance(port, uses_redis)

        urls = [f"ws://127.0.0.1:{port}/ws/BENCH" for port in ports]
        results = []
        for client_count in clients:
            print(f"{label}: {client_count} clients", flush=True)
            results.append(await run_client_step(urls, client_count, messages, timeout, delay, work_ms))
            await asyncio.sleep(0.6)

        return {
            "architecture": label,
            "instances": len(ports),
            "redisEnabled": uses_redis,
            "balancing": "sticky round-robin" if len(ports) > 1 else "none",
            "results": results,
        }
    finally:
        stop_processes(processes)


def plot(payload: Dict, output_dir: Path) -> None:
    import matplotlib.pyplot as plt

    baseline = payload["architectures"][0]["results"]
    scaled = payload["architectures"][1]["results"]
    clients = [item["clients"] for item in baseline]

    base_avg = [item["avgLatencyMs"] for item in baseline]
    scaled_avg = [item["avgLatencyMs"] for item in scaled]
    base_p95 = [item["p95LatencyMs"] for item in baseline]
    scaled_p95 = [item["p95LatencyMs"] for item in scaled]

    fig, axes = plt.subplots(1, 2, figsize=(13, 5.8), sharex=True)
    fig.patch.set_facecolor("white")

    colors = {
        "baseline": "#fb7185",
        "scaled": "#2563eb",
        "baseline_p95": "#f97316",
        "scaled_p95": "#22c55e",
    }

    ax = axes[0]
    ax.plot(clients, base_avg, marker="o", linewidth=2.8, color=colors["baseline"], label="1 instance, no Redis")
    ax.plot(clients, scaled_avg, marker="D", linewidth=2.8, color=colors["scaled"], label="4 instances, Redis + LB")
    ax.fill_between(clients, base_avg, color=colors["baseline"], alpha=0.08)
    ax.fill_between(clients, scaled_avg, color=colors["scaled"], alpha=0.08)
    ax.set_title("Average WebSocket latency", fontsize=14, fontweight="bold", loc="left")
    ax.set_ylabel("Latency (ms)")
    ax.set_xlabel("Concurrent clients")
    ax.grid(True, color="#d7dde8", linewidth=0.9, alpha=0.8)
    ax.legend(frameon=True, facecolor="#f8fafc", edgecolor="#cbd5e1")

    ax = axes[1]
    ax.plot(clients, base_p95, marker="o", linewidth=2.8, color=colors["baseline_p95"], label="1 instance, no Redis")
    ax.plot(clients, scaled_p95, marker="D", linewidth=2.8, color=colors["scaled_p95"], label="4 instances, Redis + LB")
    ax.fill_between(clients, base_p95, color=colors["baseline_p95"], alpha=0.08)
    ax.fill_between(clients, scaled_p95, color=colors["scaled_p95"], alpha=0.08)
    ax.set_title("P95 latency", fontsize=14, fontweight="bold", loc="left")
    ax.set_ylabel("Latency (ms)")
    ax.set_xlabel("Concurrent clients")
    ax.grid(True, color="#d7dde8", linewidth=0.9, alpha=0.8)
    ax.legend(frameon=True, facecolor="#f8fafc", edgecolor="#cbd5e1")

    for axis, values_a, values_b in [(axes[0], base_avg, scaled_avg), (axes[1], base_p95, scaled_p95)]:
        for x, y in zip(clients, values_a):
            if x in {clients[0], clients[-1]}:
                axis.annotate(f"{y:.0f}", (x, y), xytext=(0, 8), textcoords="offset points",
                              ha="center", fontsize=8.5, color=colors["baseline"], fontweight="bold")
        for x, y in zip(clients, values_b):
            if x in {clients[0], clients[-1]}:
                axis.annotate(f"{y:.0f}", (x, y), xytext=(0, 8), textcoords="offset points",
                              ha="center", fontsize=8.5, color=colors["scaled"], fontweight="bold")

    fig.text(
        0.06,
        0.955,
        "Latency grows slower with load balancing",
        fontsize=18,
        fontweight="bold",
        color="#111827",
    )
    fig.text(
        0.06,
        0.915,
        f"Redis enables multi-instance state; sticky load balancing spreads clients. Benchmark work: {payload['workMs']} ms/message.",
        fontsize=10,
        color="#4b5563",
    )

    last_base = baseline[-1]
    last_scaled = scaled[-1]
    improvement = (
        100 * (last_base["avgLatencyMs"] - last_scaled["avgLatencyMs"]) / last_base["avgLatencyMs"]
        if last_base["avgLatencyMs"]
        else 0
    )
    fig.text(
        0.06,
        0.035,
        f"At {clients[-1]} clients: avg latency {last_base['avgLatencyMs']:.0f} ms -> "
        f"{last_scaled['avgLatencyMs']:.0f} ms ({improvement:.0f}% lower).",
        fontsize=10,
        color="#4b5563",
    )

    fig.tight_layout(rect=[0.04, 0.08, 0.98, 0.86])
    fig.savefig(output_dir / "load_balancer_latency_5000.png", dpi=180)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clients", nargs="+", type=int, default=[100, 250, 500, 1000, 2000, 5000])
    parser.add_argument("--messages", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--delay", type=float, default=0.0)
    parser.add_argument("--work-ms", type=float, default=1.5)
    parser.add_argument("--redis-url", default="redis://127.0.0.1:6379")
    parser.add_argument("--output-dir", default="benchmarks/results-load-balanced")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "runId": uuid.uuid4().hex[:10],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "clients": args.clients,
        "messagesPerClient": args.messages,
        "workMs": args.work_ms,
        "architectures": [
            await run_architecture(
                "single-no-redis",
                [8601],
                None,
                args.clients,
                args.messages,
                args.timeout,
                args.delay,
                args.work_ms,
                output_dir,
            ),
            await run_architecture(
                "redis-load-balanced",
                [8611, 8612, 8613, 8614],
                args.redis_url,
                args.clients,
                args.messages,
                args.timeout,
                args.delay,
                args.work_ms,
                output_dir,
            ),
        ],
    }
    (output_dir / "load_balancer_latency_5000.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    plot(payload, output_dir)
    print(f"Wrote {output_dir / 'load_balancer_latency_5000.png'}")


if __name__ == "__main__":
    asyncio.run(main())
