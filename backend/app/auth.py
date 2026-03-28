from passlib.hash import pbkdf2_sha256
from app.database import users_collection, password_reset_tokens_collection
from app.email_service import email_service
import pyotp
import datetime
import secrets

SECRET_KEY = "mysecret"

def register_user(email, password):
    if users_collection.find_one({"email": email}):
        return {"error": "Email already exists"}
    
    hashed_pw = pbkdf2_sha256.hash(password)
    secret = pyotp.random_base32()  # secret pentru 2FA

    user = {
        "email": email,
        "password": hashed_pw,
        "is_verified": False,
        "2fa_secret": secret
    }
    users_collection.insert_one(user)
    
    # generează cod QR pentru Google Authenticator
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="AppName")
    return {"otp_uri": otp_uri}


def login_user(email, password, otp_code):
    user = users_collection.find_one({"email": email})
    if not user:
        return {"error": "User not found"}
    
    if not pbkdf2_sha256.verify(password, user["password"]):
        return {"error": "Wrong password"}

    totp = pyotp.TOTP(user["2fa_secret"])
    if not totp.verify(otp_code):
        return {"error": "Invalid 2FA code"}
    
    # Generate an opaque session token (no external JWT dependency)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    token = secrets.token_urlsafe(32)
    return {"token": token, "expires_at": expires_at.isoformat()}


def request_password_reset(email):
    """
    Request a password reset. Generates a secure token and sends email.
    
    Args:
        email: User's email address
        
    Returns:
        Dictionary with status and message
    """
    user = users_collection.find_one({"email": email})
    if not user:
        # For security, don't reveal if email exists
        return {
            "status": "success", 
            "message": "If this email exists, you will receive a password reset link"
        }
    
    # Generate secure reset token (valid for 1 hour)
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    
    # Store reset token in database
    password_reset_tokens_collection.insert_one({
        "token": reset_token,
        "email": email,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "expires_at": expires_at,
        "used": False
    })
    
    # Send email with reset link
    email_sent = email_service.send_password_reset_email(
        recipient_email=email,
        reset_token=reset_token,
        username=email.split("@")[0]
    )
    
    if email_sent:
        return {
            "status": "success",
            "message": "Password reset email sent. Check your inbox."
        }
    else:
        return {
            "status": "error",
            "message": "Failed to send reset email. Please try again later."
        }


def verify_reset_token(token):
    """
    Verify a password reset token is valid and not expired.
    
    Args:
        token: Reset token to verify
        
    Returns:
        Dictionary with token validity and email (if valid)
    """
    reset_request = password_reset_tokens_collection.find_one({
        "token": token,
        "used": False
    })
    
    if not reset_request:
        return {"valid": False, "error": "Invalid reset token"}
    
    # Check if token expired
    expires_at = reset_request["expires_at"]
    
    # Ensure expires_at is timezone-aware for proper comparison
    if expires_at.tzinfo is None:
        # If naive, assume UTC
        expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
    
    current_time = datetime.datetime.now(datetime.timezone.utc)
    
    if current_time > expires_at:
        return {"valid": False, "error": "Reset token has expired"}
    
    return {
        "valid": True,
        "email": reset_request["email"]
    }


def reset_password(token, new_password):
    """
    Reset user password using a valid reset token.
    
    Args:
        token: Reset token
        new_password: New password
        
    Returns:
        Dictionary with status and message
    """
    # Verify token validity
    token_check = verify_reset_token(token)
    if not token_check["valid"]:
        return {"status": "error", "message": token_check.get("error", "Invalid token")}
    
    email = token_check["email"]
    
    # Hash new password
    hashed_pw = pbkdf2_sha256.hash(new_password)
    
    # Update user password
    result = users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_pw}}
    )
    
    if result.matched_count == 0:
        return {"status": "error", "message": "User not found"}
    
    # Mark token as used
    password_reset_tokens_collection.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    return {
        "status": "success",
        "message": "Password reset successful. You can now login with your new password."
    }
