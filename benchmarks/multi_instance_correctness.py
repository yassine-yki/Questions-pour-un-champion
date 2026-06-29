"""Local two-instance correctness benchmark for the Redis scaling layer.

This benchmark shows Redis's real advantage: shared room state and
cross-instance WebSocket event delivery. It starts two local FastAPI instances,
runs the same checks without Redis and with Redis, then writes PNG charts.
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
from typing import Dict, List, Optional
from urllib.request import urlopen

import websockets


CHECKS = [
    ("room_discovery", "Room discovery\ninstance 1 -> instance 2"),
    ("cross_instance_join", "Join room\nfrom another instance"),
    ("host_event_delivery", "Host receives\nremote join event"),
    ("public_lobby_visibility", "Public room visible\nfrom another instance"),
]

COLORS = {
    "memory": "#fb7185",
    "redis": "#22c55e",
}


def http_json(url: str, timeout: float = 2.0) -> Dict:
    with urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


async def ws_roundtrip(port: int, code: str, payload: Dict, expected: str, timeout: float = 3.0) -> Dict:
    uri = f"ws://127.0.0.1:{port}/ws/{code}"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps(payload))
        while True:
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=timeout))
            if msg.get("event") == expected:
                return msg
            if msg.get("event") in {"error", "rejoinFailed"}:
                return msg


async def recv_event(ws, expected: str, timeout: float = 4.0) -> Optional[Dict]:
    deadline = time.perf_counter() + timeout
    while time.perf_counter() < deadline:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=max(0.1, deadline - time.perf_counter()))
        except asyncio.TimeoutError:
            return None
        msg = json.loads(raw)
        if msg.get("event") == expected:
            return msg
        if msg.get("event") == "error":
            return msg
    return None


async def create_and_join_host(port: int, code: str):
    ws = await websockets.connect(f"ws://127.0.0.1:{port}/ws/{code}")
    await ws.send(json.dumps({
        "action": "create",
        "language": "en",
        "subjects": ["history"],
        "gameMode": "ffa",
        "isPublic": True,
        "quizType": "classic",
    }))
    created = await recv_event(ws, "roomCreated")
    if not created or created.get("event") != "roomCreated":
        await ws.close()
        raise RuntimeError(f"Could not create room {code}: {created}")

    await ws.send(json.dumps({
        "action": "join",
        "playerName": "Host",
        "avatar": None,
    }))
    joined = await recv_event(ws, "joined")
    if not joined or joined.get("event") != "joined":
        await ws.close()
        raise RuntimeError(f"Could not join host in {code}: {joined}")

    # Drain the first players event so the later event means the remote join.
    await recv_event(ws, "players", timeout=1.0)
    return ws


async def join_remote_player(port: int, code: str) -> Dict:
    uri = f"ws://127.0.0.1:{port}/ws/{code}"
    ws = await websockets.connect(uri)
    await ws.send(json.dumps({
        "action": "join",
        "playerName": "Guest",
        "avatar": None,
    }))
    msg = await recv_event(ws, "joined")
    return {"ws": ws, "message": msg}


async def lobby_has_room(port: int, code: str) -> bool:
    uri = f"ws://127.0.0.1:{port}/ws/LOBBY"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"action": "joinLobby"}))
        msg = await recv_event(ws, "publicRooms")
        rooms = (msg or {}).get("data") or []
        return any((room.get("code") or "").upper() == code.upper() for room in rooms)


async def run_trial(port_a: int, port_b: int, code: str) -> Dict[str, bool]:
    result = {key: False for key, _ in CHECKS}
    host_ws = None
    guest_ws = None

    try:
        host_ws = await create_and_join_host(port_a, code)
        await asyncio.sleep(0.4)

        info = await ws_roundtrip(port_b, code, {"action": "getRoomInfo"}, "roomInfo")
        result["room_discovery"] = info.get("event") == "roomInfo"

        lobby_visible = await lobby_has_room(port_b, code)
        result["public_lobby_visibility"] = lobby_visible

        remote_join = await join_remote_player(port_b, code)
        guest_ws = remote_join["ws"]
        result["cross_instance_join"] = (remote_join["message"] or {}).get("event") == "joined"

        if result["cross_instance_join"]:
            players_msg = await recv_event(host_ws, "players", timeout=4.0)
            players_data = (players_msg or {}).get("data") or {}
            result["host_event_delivery"] = players_data.get("count") == 2
    except Exception as exc:
        print(f"Trial {code} failed early: {exc}")
    finally:
        for ws in [guest_ws, host_ws]:
            if ws:
                await ws.close()

    return result


def wait_for_instance(port: int, expected_redis: bool, timeout: float = 25.0) -> Dict:
    started = time.perf_counter()
    last_error = None
    while time.perf_counter() - started < timeout:
        try:
            health = http_json(f"http://127.0.0.1:{port}/api/health")
            if health.get("redis", {}).get("enabled") == expected_redis:
                return health
        except Exception as exc:
            last_error = exc
        time.sleep(0.4)
    raise RuntimeError(f"Instance on port {port} did not become ready: {last_error}")


def start_instance(port: int, instance_id: str, redis_url: Optional[str], log_dir: Path) -> subprocess.Popen:
    env = os.environ.copy()
    env["INSTANCE_ID"] = instance_id
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    if redis_url:
        env["REDIS_URL"] = redis_url
    else:
        env.pop("REDIS_URL", None)
        env.pop("RENDER_REDIS_URL", None)

    log_path = log_dir / f"{instance_id}.log"
    log_file = log_path.open("w", encoding="utf-8")
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)],
        stdout=log_file,
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
    )


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


def clear_redis(redis_url: str) -> None:
    try:
        import redis
        client = redis.Redis.from_url(redis_url)
        for key in client.scan_iter("qpuc:*"):
            client.delete(key)
    except Exception as exc:
        print(f"Could not clear Redis keys: {exc}")


async def run_mode(mode: str, use_redis: bool, trials: int, output_dir: Path) -> Dict:
    port_a = 8211 if not use_redis else 8221
    port_b = 8212 if not use_redis else 8222
    redis_url = "redis://127.0.0.1:6379" if use_redis else None
    log_dir = output_dir / "logs" / mode
    log_dir.mkdir(parents=True, exist_ok=True)

    if redis_url:
        clear_redis(redis_url)

    processes = [
        start_instance(port_a, f"{mode}-a", redis_url, log_dir),
        start_instance(port_b, f"{mode}-b", redis_url, log_dir),
    ]

    try:
        health_a = wait_for_instance(port_a, use_redis)
        health_b = wait_for_instance(port_b, use_redis)
        print(f"{mode}: instances ready ({health_a['instanceId']}, {health_b['instanceId']})")

        trial_results = []
        for index in range(trials):
            code = f"{'R' if use_redis else 'M'}{index:05d}"[:6]
            trial_results.append(await run_trial(port_a, port_b, code))
            await asyncio.sleep(0.2)

        rates = {}
        for key, _ in CHECKS:
            rates[key] = 100 * sum(1 for trial in trial_results if trial[key]) / len(trial_results)

        return {
            "mode": mode,
            "usesRedis": use_redis,
            "trials": trials,
            "successRates": rates,
            "trialResults": trial_results,
        }
    finally:
        stop_processes(processes)


def write_summary(results: List[Dict], output_dir: Path) -> None:
    rows = []
    for result in results:
        for key, label in CHECKS:
            rows.append({
                "mode": result["mode"],
                "check": key,
                "label": label.replace("\n", " "),
                "successRate": result["successRates"][key],
            })
    (output_dir / "multi_instance_correctness.json").write_text(
        json.dumps({"results": results, "rows": rows}, indent=2),
        encoding="utf-8",
    )

    lines = [
        "# Multi-instance Redis correctness benchmark",
        "",
        "| Check | No Redis | Redis |",
        "| --- | ---: | ---: |",
    ]
    by_mode = {result["mode"]: result for result in results}
    for key, label in CHECKS:
        no_redis = by_mode["memory"]["successRates"][key]
        redis_rate = by_mode["redis"]["successRates"][key]
        lines.append(f"| {label.replace(chr(10), ' ')} | {no_redis:.0f}% | {redis_rate:.0f}% |")
    (output_dir / "multi_instance_correctness.md").write_text("\n".join(lines), encoding="utf-8")


def write_chart(results: List[Dict], output_dir: Path) -> None:
    import matplotlib.pyplot as plt
    import numpy as np

    by_mode = {result["mode"]: result for result in results}
    labels = [label for _, label in CHECKS]
    memory_rates = [by_mode["memory"]["successRates"][key] for key, _ in CHECKS]
    redis_rates = [by_mode["redis"]["successRates"][key] for key, _ in CHECKS]

    x = np.arange(len(labels))
    width = 0.34

    fig, ax = plt.subplots(figsize=(11, 6.8))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    mem_bars = ax.bar(x - width / 2, memory_rates, width, label="No Redis", color=COLORS["memory"])
    redis_bars = ax.bar(x + width / 2, redis_rates, width, label="Redis", color=COLORS["redis"])

    fig.text(
        0.075,
        0.955,
        "Redis advantage in a two-instance WebSocket setup",
        fontsize=18,
        fontweight="bold",
        color="#111827",
    )
    fig.text(
        0.075,
        0.915,
        "Each check is run with two local FastAPI instances. Redis enables shared state and Pub/Sub across instances.",
        fontsize=10,
        color="#4b5563",
    )
    ax.set_ylabel("Success rate (%)", color="#4b5563")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 112)
    ax.grid(axis="y", color="#d7dde8", linewidth=0.9, alpha=0.8)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_color("#9ca3af")

    ax.legend(frameon=True, facecolor="#f8fafc", edgecolor="#9ca3af")
    ax.bar_label(mem_bars, labels=[f"{v:.0f}%" for v in memory_rates], padding=4, fontsize=10, fontweight="bold")
    ax.bar_label(redis_bars, labels=[f"{v:.0f}%" for v in redis_rates], padding=4, fontsize=10, fontweight="bold")

    fig.tight_layout(rect=[0.03, 0.04, 0.98, 0.86])
    fig.savefig(output_dir / "redis_multi_instance_advantage.png", dpi=180)
    plt.close(fig)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--trials", type=int, default=5)
    parser.add_argument("--output-dir", default="benchmarks/results-multi-instance")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    results = [
        await run_mode("memory", False, args.trials, output_dir),
        await run_mode("redis", True, args.trials, output_dir),
    ]
    write_summary(results, output_dir)
    write_chart(results, output_dir)
    print(f"Wrote multi-instance Redis results in {output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
