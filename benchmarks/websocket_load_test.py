"""WebSocket latency benchmark for the QPUC scalability demo.

Example:
    python benchmarks/websocket_load_test.py --architecture memory-single --clients 10 25 50
    python benchmarks/websocket_load_test.py --architecture redis-pubsub --clients 10 25 50
"""

import argparse
import asyncio
import json
import math
import statistics
import time
import uuid
from pathlib import Path
from typing import Dict, List

import websockets


def percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, math.ceil((pct / 100) * len(ordered)) - 1))
    return ordered[index]


async def read_until_pong(ws, timeout: float):
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        msg = json.loads(raw)
        if msg.get("event") == "benchPong":
            return msg


async def client_worker(
    url: str,
    client_id: str,
    messages: int,
    timeout: float,
    delay: float,
) -> Dict:
    latencies: List[float] = []
    failures = 0
    instances: Dict[str, int] = {}

    try:
        async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
            for seq in range(messages):
                sent_ns = time.perf_counter_ns()
                await ws.send(json.dumps({
                    "action": "benchPing",
                    "sentAt": sent_ns,
                    "clientId": client_id,
                    "seq": seq,
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


async def run_scenario(args, clients: int) -> Dict:
    started = time.perf_counter()
    workers = [
        client_worker(
            args.url,
            f"client-{clients}-{i}",
            args.messages,
            args.timeout,
            args.delay,
        )
        for i in range(clients)
    ]
    client_results = await asyncio.gather(*workers)
    duration_seconds = time.perf_counter() - started

    latencies = [
        latency
        for result in client_results
        for latency in result["latenciesMs"]
    ]
    failures = sum(result["failures"] for result in client_results)
    attempted = clients * args.messages
    succeeded = len(latencies)
    instance_hits: Dict[str, int] = {}
    for result in client_results:
        for instance_id, count in result["instances"].items():
            instance_hits[instance_id] = instance_hits.get(instance_id, 0) + count

    return {
        "clients": clients,
        "messagesPerClient": args.messages,
        "attemptedMessages": attempted,
        "successfulMessages": succeeded,
        "failedMessages": failures,
        "failureRate": failures / attempted if attempted else 0,
        "durationSeconds": duration_seconds,
        "throughputMessagesPerSecond": succeeded / duration_seconds if duration_seconds else 0,
        "avgLatencyMs": statistics.mean(latencies) if latencies else 0,
        "medianLatencyMs": statistics.median(latencies) if latencies else 0,
        "p95LatencyMs": percentile(latencies, 95),
        "maxLatencyMs": max(latencies) if latencies else 0,
        "instanceHits": instance_hits,
    }


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="ws://127.0.0.1:8000/ws/BENCH")
    parser.add_argument("--architecture", required=True)
    parser.add_argument("--clients", nargs="+", type=int, default=[10, 25, 50])
    parser.add_argument("--messages", type=int, default=20)
    parser.add_argument("--timeout", type=float, default=5.0)
    parser.add_argument("--delay", type=float, default=0.02)
    parser.add_argument("--output-dir", default="benchmarks/results")
    args = parser.parse_args()

    run = {
        "runId": uuid.uuid4().hex[:10],
        "architecture": args.architecture,
        "target": args.url,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "results": [],
    }

    for clients in args.clients:
        print(f"Running {args.architecture}: {clients} clients")
        run["results"].append(await run_scenario(args, clients))

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{args.architecture}_{run['runId']}.json"
    output.write_text(json.dumps(run, indent=2), encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    asyncio.run(main())
