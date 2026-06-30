# Observability Demo

This project includes a lightweight observability layer for the school demo.

## How to open it

Run the app, then open:

```text
http://127.0.0.1:8000/observability
```

On Render, use:

```text
https://questions-pour-un-champion.onrender.com/observability
```

The raw JSON is available at:

```text
/api/metrics
```

## What it shows

- Instance identity and uptime.
- Redis configuration, enabled state, ping result, and channel.
- Active rooms, public rooms, connected players, and local WebSocket connections.
- Runtime counters for WebSocket messages, rooms created/deleted, joins, disconnects, reconnects, and broadcasts.
- Top real-time events sent by the server.
- Room state distribution, such as waiting, question, answered, gameOver.

## Jury explanation

The goal is not only to add features, but to make the system observable.

When the app scales to multiple instances, bugs become harder to understand if the server is a black box. The dashboard answers operational questions quickly:

- Is this instance healthy?
- Is Redis enabled?
- How many rooms and players are active?
- Are WebSocket events flowing?
- Are disconnects or reconnects happening?

This supports the scalability story: Redis and load balancing make horizontal scaling possible, while observability lets us verify and explain the system while it is running.

## Game-quality polish included

The lobby now receives richer room metadata from the server:

- game mode
- visibility
- quiz type
- subject count
- ready-to-start state

The lobby UI shows a readiness meter so players understand why the start button is visible or hidden.
