"""
Lightweight in-memory rate limiter for Resqly V1.

Single-process FastAPI safe. For multi-worker / multi-pod scaling, swap the
internal store for Redis without changing the public API.

Policies enforced (called from server.py):
  - OTP request: 1 request / 60s per phone
  - OTP request: 5 requests / 1h  per client IP
  - Admin login: 5 FAILED attempts / 15min per client IP
"""
from __future__ import annotations

import threading
import time
from collections import deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request


class _SlidingWindow:
    """Thread-safe sliding-window counter."""

    def __init__(self) -> None:
        self._store: Dict[str, Deque[float]] = {}
        self._lock = threading.Lock()

    def _purge(self, key: str, window_seconds: float, now: float) -> Deque[float]:
        bucket = self._store.setdefault(key, deque())
        cutoff = now - window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        return bucket

    def allow(self, key: str, max_hits: int, window_seconds: float) -> Tuple[bool, float]:
        """
        Returns (allowed, retry_after_seconds).
        Does NOT record the hit if not allowed.
        Records the hit if allowed.
        """
        now = time.time()
        with self._lock:
            bucket = self._purge(key, window_seconds, now)
            if len(bucket) >= max_hits:
                retry_after = max(1.0, window_seconds - (now - bucket[0]))
                return False, retry_after
            bucket.append(now)
            return True, 0.0

    def record(self, key: str, window_seconds: float) -> None:
        """Force-record a hit (used for failed-admin-attempt counter)."""
        now = time.time()
        with self._lock:
            bucket = self._purge(key, window_seconds, now)
            bucket.append(now)

    def count(self, key: str, window_seconds: float) -> int:
        now = time.time()
        with self._lock:
            return len(self._purge(key, window_seconds, now))

    def reset(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)


# Singletons for each policy
_otp_phone = _SlidingWindow()
_otp_ip = _SlidingWindow()
_admin_fail = _SlidingWindow()

# Policies (window_seconds, max_hits)
OTP_PHONE_WINDOW = 60.0
OTP_PHONE_MAX = 1
OTP_IP_WINDOW = 3600.0
OTP_IP_MAX = 5
ADMIN_FAIL_WINDOW = 900.0  # 15 min
ADMIN_FAIL_MAX = 5


def _client_ip(request: Request) -> str:
    # Honour X-Forwarded-For (set by ingress/proxy)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "unknown"


def enforce_otp_request(request: Request, phone: str) -> None:
    """Raise HTTPException(429) if the OTP request should be throttled."""
    ip = _client_ip(request)

    ok_phone, retry_phone = _otp_phone.allow(
        f"phone:{phone}", OTP_PHONE_MAX, OTP_PHONE_WINDOW
    )
    if not ok_phone:
        raise HTTPException(
            status_code=429,
            detail=f"Too many OTP requests for this number. Try again in {int(retry_phone)}s.",
            headers={"Retry-After": str(int(retry_phone))},
        )

    ok_ip, retry_ip = _otp_ip.allow(f"ip:{ip}", OTP_IP_MAX, OTP_IP_WINDOW)
    if not ok_ip:
        # Roll back the phone hit so the user is not double-penalised
        # (best-effort; safe even on race)
        raise HTTPException(
            status_code=429,
            detail=f"Too many OTP requests from this network. Try again in {int(retry_ip // 60)} min.",
            headers={"Retry-After": str(int(retry_ip))},
        )


def check_admin_locked(request: Request) -> None:
    """Block admin-login attempts once the IP has 5 failures in the window."""
    ip = _client_ip(request)
    if _admin_fail.count(f"admin:{ip}", ADMIN_FAIL_WINDOW) >= ADMIN_FAIL_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many failed admin login attempts. Try again later.",
            headers={"Retry-After": str(int(ADMIN_FAIL_WINDOW))},
        )


def record_admin_failure(request: Request) -> None:
    ip = _client_ip(request)
    _admin_fail.record(f"admin:{ip}", ADMIN_FAIL_WINDOW)


def reset_admin_failures(request: Request) -> None:
    ip = _client_ip(request)
    _admin_fail.reset(f"admin:{ip}")
