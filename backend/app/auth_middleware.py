"""
Authentication Middleware for SmartChef
Provides token validation and session management
"""

from fastapi import Header, HTTPException
from typing import Optional
from app.database import sessions_collection, users_collection
from datetime import datetime, timezone
import secrets

def create_session(user_email: str) -> dict:
    """
    Create a new session token for authenticated user.
    
    Args:
        user_email: Email of authenticated user
        
    Returns:
        dict with token and expiration
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc)
    
    # Calculate expiration (24 hours)
    from datetime import timedelta
    expires_at = expires_at + timedelta(hours=24)
    
    session_doc = {
        "token": token,
        "user_email": user_email,
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
        "is_active": True
    }
    
    sessions_collection.insert_one(session_doc)
    
    return {
        "token": token,
        "expires_at": expires_at.isoformat()
    }


def validate_token(token: str) -> Optional[str]:
    """
    Validate session token and return user email if valid.
    
    Args:
        token: Session token to validate
        
    Returns:
        User email if valid, None otherwise
    """
    if not token:
        return None
    
    session = sessions_collection.find_one({
        "token": token,
        "is_active": True
    })
    
    if not session:
        return None
    
    # Check expiration
    if session["expires_at"] < datetime.now(timezone.utc):
        # Mark session as expired
        sessions_collection.update_one(
            {"token": token},
            {"$set": {"is_active": False}}
        )
        return None
    
    return session["user_email"]


def revoke_token(token: str):
    """
    Revoke (logout) a session token.
    
    Args:
        token: Token to revoke
    """
    sessions_collection.update_one(
        {"token": token},
        {"$set": {"is_active": False}}
    )


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> str:
    """
    FastAPI dependency to get current authenticated user.
    
    Usage:
        @app.get("/protected")
        def protected_route(user_email: str = Depends(get_current_user)):
            return {"user": user_email}
    
    Args:
        authorization: Bearer token from Authorization header
        
    Returns:
        User email
        
    Raises:
        HTTPException 401 if not authenticated
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    user_email = validate_token(token)
    
    if not user_email:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    return user_email
