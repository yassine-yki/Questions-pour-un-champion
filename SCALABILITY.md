# Scalability Notes

This project started as a single FastAPI WebSocket server with rooms stored in
Python memory. That is simple and fast for a school demo, but it has one clear
limit: if Render runs several service instances, each instance has its own
memory.

## Current Scaling Improvement

The app now has an optional Redis scaling layer.

```text
Players
   |
   v
Render load balancer
   |
   +-- FastAPI instance 1
   +-- FastAPI instance 2
   +-- FastAPI instance 3
           |
           v
        Redis
```

Redis is used for two jobs:

1. Shared room snapshots

   Room state is saved in Redis so another instance can discover the room if a
   player is routed there.

2. Redis Pub/Sub event bus

   When one instance broadcasts a WebSocket event, it also publishes the event
   to Redis. The other FastAPI instances receive it and forward it to their own
   local WebSocket clients.

This means a room can continue working even when players in the same room are
connected to different Render instances.

## Why WebSocket Connections Still Stay Local

Redis cannot store live WebSocket objects. A WebSocket connection is an active
Python object inside one FastAPI process.

So each instance still keeps its own local connections:

```python
connections = {}
```

Redis coordinates the instances, but each instance sends messages only to the
clients currently connected to that instance.

## Environment Variables

Without Redis, the app automatically uses the original memory-only behavior.

With Redis:

```text
REDIS_URL=redis://...
```

Optional:

```text
INSTANCE_ID=render-instance-1
REDIS_CHANNEL=qpuc:events
REDIS_ROOM_TTL_SECONDS=7200
```

On Render, use a Redis-compatible service such as Render Key Value, then add the
Redis URL as an environment variable on the Web Service.

## Observability Endpoints

```text
/api/health
/api/stats
```

These endpoints show whether Redis is enabled, which instance handled the
request, how many local WebSocket connections exist, and how many rooms are
known.

## Benchmark Graphs

The benchmark uses a lightweight WebSocket ping action:

```json
{"action": "benchPing"}
```

The server answers:

```json
{"event": "benchPong"}
```

This lets us measure WebSocket round-trip latency without creating full game
rooms.

Run a baseline test:

```powershell
python benchmarks/websocket_load_test.py --architecture memory-single --clients 10 25 50
```

Run the Redis/PubSub test:

```powershell
python benchmarks/websocket_load_test.py --architecture redis-pubsub --clients 10 25 50
```

Generate the report:

```powershell
python benchmarks/generate_report.py
```

Outputs:

```text
benchmarks/results/summary.csv
benchmarks/results/summary.md
benchmarks/results/latency_avg.png
benchmarks/results/latency_p95.png
benchmarks/results/failures.png
benchmarks/results/throughput.png
```

## What To Tell The Jury

The important engineering message is:

> I did not just add more game features. I identified the scaling limit of a
> WebSocket app with in-memory rooms, introduced Redis for shared state and
> Pub/Sub coordination, then measured the difference with benchmark graphs.

## Remaining Production Step

The Redis layer already uses room-level locks in the main critical gameplay
sections. For a large production system, the next step would be to move more of
the game rules into smaller services and make every room mutation pass through a
single room-state API. For this school project, the current implementation keeps
the solution understandable while demonstrating the real architecture pattern.
