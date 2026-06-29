"""Cross-instance benchmark that makes the Redis advantage visible.

The test starts two local app instances:
1. Instance A creates rooms.
2. Up to 5000 clients query instance B for those room codes.

Without Redis, instance B only has its own in-memory state, so it cannot find
the rooms. With Redis, instance B loads the shared room snapshots.
"""

import argparse
import asyncio
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import websockets


def http_json(url, timeout=2.0):
    with urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


async def wait_for_event(ws, expected, timeout=5.0):
    deadline = time.perf_counter() + timeout
    while time.perf_counter() < deadline:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=max(0.1, deadline - time.perf_counter()))
        except asyncio.TimeoutError:
            return None
        msg = json.loads(raw)
        if msg.get("event") == expected or msg.get("event") == "error":
            return msg
    return None


async def create_room(port, code):
    async with websockets.connect(f"ws://127.0.0.1:{port}/ws/{code}") as ws:
        await ws.send(json.dumps({
            "action": "create",
            "language": "en",
            "subjects": ["history"],
            "gameMode": "ffa",
            "isPublic": False,
            "quizType": "classic",
        }))
        msg = await wait_for_event(ws, "roomCreated")
        return bool(msg and msg.get("event") == "roomCreated")


async def seed_rooms(port, count):
    created_codes = []
    for index in range(count):
        code = f"S{index:05d}"[-6:]
        if await create_room(port, code):
            created_codes.append(code)
        await asyncio.sleep(0.01)
    return created_codes


async def fetch_room_info(port, code):
    started = time.perf_counter_ns()
    try:
        async with websockets.connect(f"ws://127.0.0.1:{port}/ws/{code}") as ws:
            await ws.send(json.dumps({"action": "getRoomInfo"}))
            msg = await wait_for_event(ws, "roomInfo", timeout=10.0)
            latency_ms = (time.perf_counter_ns() - started) / 1_000_000
            return {
                "success": bool(msg and msg.get("event") == "roomInfo"),
                "latencyMs": latency_ms,
            }
    except Exception:
        latency_ms = (time.perf_counter_ns() - started) / 1_000_000
        return {"success": False, "latencyMs": latency_ms}


async def run_read_step(port_b, clients, room_codes, max_concurrency):
    if not room_codes:
        return {
            "clients": clients,
            "successfulReads": 0,
            "successRate": 0,
            "avgLatencyMs": 0,
            "p95LatencyMs": 0,
            "requestsPerSecond": 0,
            "durationSeconds": 0,
        }

    semaphore = asyncio.Semaphore(max_concurrency)

    async def guarded_fetch(index):
        async with semaphore:
            return await fetch_room_info(port_b, room_codes[index % len(room_codes)])

    started = time.perf_counter()
    results = await asyncio.gather(*(guarded_fetch(index) for index in range(clients)))
    duration = time.perf_counter() - started

    successes = [item for item in results if item["success"]]
    latencies = sorted(item["latencyMs"] for item in results)
    p95 = latencies[int(len(latencies) * 0.95) - 1] if latencies else 0
    avg = sum(latencies) / len(latencies) if latencies else 0

    return {
        "clients": clients,
        "successfulReads": len(successes),
        "successRate": 100 * len(successes) / clients if clients else 0,
        "avgLatencyMs": avg,
        "p95LatencyMs": p95,
        "requestsPerSecond": clients / duration if duration else 0,
        "durationSeconds": duration,
    }


def wait_for_instance(port, expected_redis, timeout=25):
    started = time.perf_counter()
    while time.perf_counter() - started < timeout:
        try:
            health = http_json(f"http://127.0.0.1:{port}/api/health")
            if health.get("redis", {}).get("enabled") == expected_redis:
                return
        except Exception:
            pass
        time.sleep(0.4)
    raise RuntimeError(f"Instance {port} did not become ready")


def start_instance(port, instance_id, redis_url, log_dir):
    env = os.environ.copy()
    env["INSTANCE_ID"] = instance_id
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    if redis_url:
        env["REDIS_URL"] = redis_url
    else:
        env.pop("REDIS_URL", None)
        env.pop("RENDER_REDIS_URL", None)
    log = (log_dir / f"{instance_id}.log").open("w", encoding="utf-8")
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)],
        stdout=log,
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
    )


def stop_processes(processes):
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


def clear_redis(redis_url):
    try:
        import redis
        client = redis.Redis.from_url(redis_url)
        for key in client.scan_iter("qpuc:*"):
            client.delete(key)
    except Exception as exc:
        print(f"Could not clear Redis: {exc}")


async def run_mode(mode, use_redis, client_steps, seed_room_count, max_concurrency, output_dir):
    port_a = 8311 if not use_redis else 8321
    port_b = 8312 if not use_redis else 8322
    redis_url = "redis://127.0.0.1:6379" if use_redis else None
    if redis_url:
        clear_redis(redis_url)

    log_dir = output_dir / "logs" / mode
    log_dir.mkdir(parents=True, exist_ok=True)
    processes = [
        start_instance(port_a, f"{mode}-a", redis_url, log_dir),
        start_instance(port_b, f"{mode}-b", redis_url, log_dir),
    ]
    try:
        wait_for_instance(port_a, use_redis)
        wait_for_instance(port_b, use_redis)
        created_codes = await seed_rooms(port_a, seed_room_count)
        await asyncio.sleep(0.8)

        mode_results = []
        for clients in client_steps:
            print(f"{mode}: {clients} clients")
            mode_results.append(await run_read_step(port_b, clients, created_codes, max_concurrency))
            await asyncio.sleep(0.2)

        return {
            "mode": mode,
            "usesRedis": use_redis,
            "seedRoomsRequested": seed_room_count,
            "seedRoomsCreated": len(created_codes),
            "results": mode_results,
        }
    finally:
        stop_processes(processes)


def plot(payload, output_dir):
    import matplotlib.pyplot as plt

    by_mode = {item["mode"]: item for item in payload["modes"]}
    x = [item["clients"] for item in by_mode["memory"]["results"]]
    memory_success = [item["successRate"] for item in by_mode["memory"]["results"]]
    redis_success = [item["successRate"] for item in by_mode["redis"]["results"]]
    memory_rps = [item["requestsPerSecond"] for item in by_mode["memory"]["results"]]
    redis_rps = [item["requestsPerSecond"] for item in by_mode["redis"]["results"]]
    redis_avg = [item["avgLatencyMs"] for item in by_mode["redis"]["results"]]
    redis_p95 = [item["p95LatencyMs"] for item in by_mode["redis"]["results"]]

    fig, axes = plt.subplots(1, 2, figsize=(13, 5.6))
    fig.patch.set_facecolor("white")

    ax = axes[0]
    ax.plot(x, memory_success, marker="o", linewidth=2.6, color="#fb7185", label="No Redis")
    ax.plot(x, redis_success, marker="D", linewidth=2.6, color="#22c55e", label="Redis")
    ax.set_title("Cross-instance discovery correctness", fontsize=14, fontweight="bold", loc="left")
    ax.set_xlabel("Concurrent clients querying instance B")
    ax.set_ylabel("Clients seeing rooms from instance A (%)")
    ax.set_ylim(-5, 105)
    ax.grid(True, color="#d7dde8", alpha=0.8)
    ax.legend(frameon=True)
    label_points = {x[0], x[3], x[-1]} if len(x) >= 4 else set(x)
    for xs, ys in [(x, memory_success), (x, redis_success)]:
        for xi, yi in zip(xs, ys):
            if xi not in label_points:
                continue
            ax.annotate(f"{yi:.0f}%", (xi, yi), xytext=(0, 8), textcoords="offset points",
                        ha="center", fontsize=8.5, fontweight="bold")

    ax = axes[1]
    ax.plot(x, memory_rps, marker="o", linewidth=2.6, color="#fb7185", label="No Redis requests/s")
    ax.plot(x, redis_rps, marker="D", linewidth=2.6, color="#22c55e", label="Redis requests/s")
    ax2 = ax.twinx()
    ax2.plot(x, redis_avg, marker="o", linewidth=2.0, color="#2563eb", alpha=0.85, label="Redis avg latency")
    ax2.plot(x, redis_p95, marker="D", linewidth=2.0, color="#f97316", alpha=0.85, label="Redis p95 latency")
    ax.set_title("Throughput and Redis latency", fontsize=14, fontweight="bold", loc="left")
    ax.set_xlabel("Concurrent clients")
    ax.set_ylabel("Requests per second")
    ax2.set_ylabel("Redis latency (ms)")
    ax.grid(True, color="#d7dde8", alpha=0.8)
    lines, labels = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines + lines2, labels + labels2, frameon=True, loc="upper left")

    fig.suptitle("Redis vs no Redis at 5000 cross-instance clients", fontsize=18, fontweight="bold", x=0.06, ha="left")
    fig.text(0.06, 0.91, "Rooms are created on instance A; clients query instance B. Redis shares state between instances.", color="#4b5563")
    fig.tight_layout(rect=[0.03, 0.04, 0.98, 0.88])
    fig.savefig(output_dir / "redis_vs_no_redis_5000.png", dpi=180)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clients", nargs="+", type=int, default=[100, 250, 500, 1000, 2000, 5000])
    parser.add_argument("--seed-rooms", type=int, default=50)
    parser.add_argument("--max-concurrency", type=int, default=500)
    parser.add_argument("--output-dir", default="benchmarks/results-cross-instance-5000")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "modes": [
            await run_mode("memory", False, args.clients, args.seed_rooms, args.max_concurrency, output_dir),
            await run_mode("redis", True, args.clients, args.seed_rooms, args.max_concurrency, output_dir),
        ]
    }
    (output_dir / "redis_vs_no_redis_5000.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    plot(payload, output_dir)
    print(f"Wrote {output_dir / 'redis_vs_no_redis_5000.png'}")


if __name__ == "__main__":
    asyncio.run(main())
