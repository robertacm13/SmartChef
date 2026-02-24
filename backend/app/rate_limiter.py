"""
Rate limiting middleware for SmartChef API
Protects against brute force attacks and API abuse
"""

from fastapi import HTTPException, Request
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio
from typing import Dict, Tuple

# In-memory storage for rate limiting (for production, use Redis)
rate_limit_storage: Dict[str, list] = defaultdict(list)

# Rate limit configurations
RATE_LIMITS = {
    "login": {
        "max_attempts": 5,
        "window_minutes": 15,
        "block_minutes": 30
    },
    "register": {
        "max_attempts": 3,
        "window_minutes": 60,
        "block_minutes": 120
    },
    "upload": {
        "max_attempts": 20,
        "window_minutes": 60,
        "block_minutes": 10
    },
    "api": {
        "max_attempts": 100,
        "window_minutes": 15,
        "block_minutes": 5
    }
}


def get_client_ip(request: Request) -> str:
    """
    Extract client IP from request.
    Handles proxy headers (X-Forwarded-For).
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address
    """
    # Check for proxy headers
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Fallback to direct connection
    return request.client.host if request.client else "unknown"


def check_rate_limit(
    identifier: str,
    limit_type: str = "api"
) -> Tuple[bool, int]:
    """
    Check if request is within rate limit.
    
    Args:
        identifier: Unique identifier (IP address or user email)
        limit_type: Type of rate limit to apply (login, register, upload, api)
        
    Returns:
        Tuple of (is_allowed, retry_after_seconds)
    """
    config = RATE_LIMITS.get(limit_type, RATE_LIMITS["api"])
    max_attempts = config["max_attempts"]
    window_minutes = config["window_minutes"]
    block_minutes = config["block_minutes"]
    
    now = datetime.now()
    key = f"{limit_type}:{identifier}"
    
    # Get request history for this identifier
    request_times = rate_limit_storage[key]
    
    # Remove old requests outside the window
    cutoff_time = now - timedelta(minutes=window_minutes)
    request_times[:] = [t for t in request_times if t > cutoff_time]
    
    # Check if blocked (too many recent attempts)
    if len(request_times) >= max_attempts:
        # Calculate how long user must wait
        oldest_in_window = min(request_times)
        block_until = oldest_in_window + timedelta(minutes=block_minutes)
        
        if now < block_until:
            retry_after = int((block_until - now).total_seconds())
            return False, retry_after
    
    # Add current request
    request_times.append(now)
    
    return True, 0


class RateLimitException(HTTPException):
    """Custom exception for rate limit errors"""
    
    def __init__(self, retry_after: int, limit_type: str = "API"):
        minutes = retry_after // 60
        seconds = retry_after % 60
        
        if minutes > 0:
            wait_time = f"{minutes} minute{'s' if minutes > 1 else ''}"
            if seconds > 0:
                wait_time += f" și {seconds} secunde"
        else:
            wait_time = f"{seconds} secunde"
        
        detail = (
            f"Prea multe încercări {limit_type}. "
            f"Te rugăm să aștepți {wait_time} înainte de a încerca din nou."
        )
        
        super().__init__(
            status_code=429,
            detail=detail,
            headers={"Retry-After": str(retry_after)}
        )


async def rate_limit_middleware(
    request: Request,
    limit_type: str = "api"
) -> None:
    """
    Rate limit middleware for FastAPI endpoints.
    
    Usage:
        @app.post("/login")
        async def login(request: Request, ...):
            await rate_limit_middleware(request, "login")
            ...
    
    Args:
        request: FastAPI request
        limit_type: Type of rate limit
        
    Raises:
        RateLimitException if rate limit exceeded
    """
    client_ip = get_client_ip(request)
    is_allowed, retry_after = check_rate_limit(client_ip, limit_type)
    
    if not is_allowed:
        raise RateLimitException(retry_after, limit_type)


# Cleanup task to prevent memory leak
async def cleanup_old_entries():
    """
    Periodic cleanup of old rate limit entries.
    Should be run as background task.
    """
    while True:
        await asyncio.sleep(3600)  # Run every hour
        
        now = datetime.now()
        cutoff = now - timedelta(hours=2)
        
        # Clean up old entries
        for key in list(rate_limit_storage.keys()):
            rate_limit_storage[key] = [
                t for t in rate_limit_storage[key] if t > cutoff
            ]
            
            # Remove empty entries
            if not rate_limit_storage[key]:
                del rate_limit_storage[key]
