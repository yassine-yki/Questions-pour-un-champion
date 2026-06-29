"""Optional Redis scaling support for multi-instance WebSocket deployments.

The game still works with no Redis server. When REDIS_URL is configured, this
module stores room snapshots in Redis and uses Redis Pub/Sub as the event bus
between FastAPI instances.
"""

import json
import os
import time
import uuid
from typing import Any, Awaitable, Callable, Dict, List, Optional

try:
    import redis.asyncio as redis
except ImportError:  # pragma: no cover - useful when running the app locally
    redis = None


RedisMessageHandler = Callable[[Dict[str, Any]], Awaitable[None]]


class RedisScalingLayer:
    def __init__(self) -> None:
        self.redis_url = os.environ.get("REDIS_URL") or os.environ.get("RENDER_REDIS_URL")
        self.instance_id = os.environ.get("INSTANCE_ID") or uuid.uuid4().hex[:8]
        self.channel = os.environ.get("REDIS_CHANNEL", "qpuc:events")
        self.room_prefix = os.environ.get("REDIS_ROOM_PREFIX", "qpuc:room")
        self.room_ttl = int(os.environ.get("REDIS_ROOM_TTL_SECONDS", "7200"))
        self.client = None
        self.available = bool(self.redis_url and redis is not None)
        self.last_error: Optional[str] = None

    @property
    def enabled(self) -> bool:
        return bool(self.available and self.client is not None)

    def room_key(self, code: str) -> str:
        return f"{self.room_prefix}:{code.upper()}"

    def room_lock(self, code: str, timeout: int = 60, blocking_timeout: int = 5):
        if not self.enabled:
            return None
        return self.client.lock(
            f"{self.room_key(code)}:lock",
            timeout=timeout,
            blocking_timeout=blocking_timeout,
        )

    async def connect(self) -> bool:
        if not self.redis_url:
            self.last_error = "REDIS_URL is not configured"
            return False
        if redis is None:
            self.last_error = "redis package is not installed"
            return False

        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            await self.client.ping()
            self.available = True
            self.last_error = None
            print(f"Redis scaling enabled on instance {self.instance_id}")
            return True
        except Exception as exc:
            self.client = None
            self.available = False
            self.last_error = str(exc)
            print(f"Redis scaling disabled: {exc}")
            return False

    async def close(self) -> None:
        if self.client is not None:
            await self.client.aclose()
        self.client = None

    async def save_room(
        self,
        code: str,
        room: Dict[str, Any],
        disconnected: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not self.enabled:
            return
        payload = {
            "code": code.upper(),
            "room": room,
            "disconnected": disconnected or {},
            "savedAt": time.time(),
            "savedBy": self.instance_id,
        }
        await self.client.set(
            self.room_key(code),
            json.dumps(payload, ensure_ascii=False),
            ex=self.room_ttl,
        )

    async def load_room(self, code: str) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None
        raw = await self.client.get(self.room_key(code))
        if not raw:
            return None
        return json.loads(raw)

    async def delete_room(self, code: str) -> None:
        if self.enabled:
            await self.client.delete(self.room_key(code))

    async def list_public_rooms(self) -> List[Dict[str, Any]]:
        if not self.enabled:
            return []

        rooms: List[Dict[str, Any]] = []
        pattern = f"{self.room_prefix}:*"
        async for key in self.client.scan_iter(match=pattern):
            if key.endswith(":lock"):
                continue
            raw = await self.client.get(key)
            if not raw:
                continue
            try:
                payload = json.loads(raw)
                code = payload.get("code") or key.rsplit(":", 1)[-1]
                room = payload.get("room") or {}
                if not room.get("is_public") or room.get("state") != "waiting":
                    continue
                host = room.get("host")
                players = room.get("players") or {}
                if host not in players:
                    continue
                connected_count = sum(1 for p in players.values() if p.get("connected", True))
                rooms.append({
                    "code": code,
                    "hostName": players[host]["name"],
                    "playerCount": connected_count,
                    "gameMode": room.get("game_mode", "ffa"),
                    "state": room.get("state", "waiting"),
                    "maxPlayers": 4,
                    "updatedAt": payload.get("savedAt", time.time()),
                })
            except Exception as exc:
                print(f"Could not read Redis room snapshot {key}: {exc}")
        rooms.sort(key=lambda item: item.get("updatedAt", 0), reverse=True)
        return rooms

    async def count_rooms(self) -> int:
        if not self.enabled:
            return 0
        count = 0
        async for key in self.client.scan_iter(match=f"{self.room_prefix}:*"):
            if not key.endswith(":lock"):
                count += 1
        return count

    async def publish_event(
        self,
        code: str,
        event: str,
        data: Any,
        *,
        exclude: Optional[str] = None,
        target: Optional[str] = None,
    ) -> None:
        if not self.enabled:
            return
        payload = {
            "kind": "ws_event",
            "source": self.instance_id,
            "code": code.upper(),
            "event": event,
            "data": data,
            "exclude": exclude,
            "target": target,
            "publishedAt": time.time(),
        }
        await self.client.publish(self.channel, json.dumps(payload, ensure_ascii=False))

    async def publish_room_deleted(self, code: str) -> None:
        if not self.enabled:
            return
        payload = {
            "kind": "room_deleted",
            "source": self.instance_id,
            "code": code.upper(),
            "publishedAt": time.time(),
        }
        await self.client.publish(self.channel, json.dumps(payload, ensure_ascii=False))

    async def run_subscriber(self, handler: RedisMessageHandler) -> None:
        if not self.enabled:
            return
        pubsub = self.client.pubsub()
        await pubsub.subscribe(self.channel)
        print(f"Redis Pub/Sub subscriber listening on {self.channel}")
        try:
            async for message in pubsub.listen():
                if message.get("type") != "message":
                    continue
                try:
                    payload = json.loads(message.get("data") or "{}")
                    await handler(payload)
                except Exception as exc:
                    print(f"Redis Pub/Sub handler error: {exc}")
        finally:
            await pubsub.unsubscribe(self.channel)
            await pubsub.aclose()

    async def health(self) -> Dict[str, Any]:
        status = {
            "configured": bool(self.redis_url),
            "enabled": self.enabled,
            "instanceId": self.instance_id,
            "channel": self.channel,
            "lastError": self.last_error,
        }
        if self.enabled:
            try:
                await self.client.ping()
                status["ping"] = "ok"
            except Exception as exc:
                status["ping"] = "failed"
                status["lastError"] = str(exc)
        return status
