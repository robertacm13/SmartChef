from passlib.hash import pbkdf2_sha256
from app.database import users_collection
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
