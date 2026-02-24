"""
Input validation and sanitization utilities
"""

import re
from typing import Optional
from fastapi import HTTPException, UploadFile
from pydantic import BaseModel, EmailStr, validator, Field

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/webp",
    "image/heic"
}

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


class EmailValidator:
    """Validate and sanitize email addresses"""
    
    @staticmethod
    def validate(email: str) -> str:
        """
        Validate email format and sanitize.
        
        Args:
            email: Email to validate
            
        Returns:
            Sanitized email (lowercase)
            
        Raises:
            HTTPException if invalid
        """
        if not email or len(email) > 254:
            raise HTTPException(
                status_code=400,
                detail="Invalid email address"
            )
        
        # Basic email regex
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format"
            )
        
        # Convert to lowercase for consistency
        return email.lower().strip()


class PasswordValidator:
    """Validate password strength"""
    
    @staticmethod
    def validate(password: str) -> None:
        """
        Validate password meets security requirements.
        
        Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character
        
        Args:
            password: Password to validate
            
        Raises:
            HTTPException with specific requirement that failed
        """
        if not password or len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Parola trebuie să aibă minim 8 caractere"
            )
        
        if len(password) > 128:
            raise HTTPException(
                status_code=400,
                detail="Parola este prea lungă (maxim 128 caractere)"
            )
        
        if not re.search(r'[A-Z]', password):
            raise HTTPException(
                status_code=400,
                detail="Parola trebuie să conțină cel puțin o literă mare"
            )
        
        if not re.search(r'[a-z]', password):
            raise HTTPException(
                status_code=400,
                detail="Parola trebuie să conțină cel puțin o literă mică"
            )
        
        if not re.search(r'[0-9]', password):
            raise HTTPException(
                status_code=400,
                detail="Parola trebuie să conțină cel puțin o cifră"
            )
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise HTTPException(
                status_code=400,
                detail="Parola trebuie să conțină cel puțin un caracter special"
            )


class FileValidator:
    """Validate uploaded files"""
    
    @staticmethod
    async def validate_image(file: UploadFile) -> None:
        """
        Validate uploaded image file.
        
        Checks:
        - File size
        - MIME type
        - File extension
        - File is not empty
        
        Args:
            file: Uploaded file
            
        Raises:
            HTTPException if validation fails
        """
        # Check file exists
        if not file or not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Niciun fișier selectat"
            )
        
        # Check file extension
        import os
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Tip fișier invalid. Sunt permise: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check MIME type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Tip imagine invalid. Content-Type: {file.content_type}"
            )
        
        # Check file size
        # Read file to check size
        contents = await file.read()
        file_size = len(contents)
        
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Fișierul este gol"
            )
        
        if file_size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE / (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"Fișierul este prea mare ({actual_mb:.1f}MB). Maxim permis: {max_mb:.1f}MB"
            )
        
        # Reset file pointer for further processing
        await file.seek(0)


class OTPValidator:
    """Validate OTP codes"""
    
    @staticmethod
    def validate(otp_code: str) -> str:
        """
        Validate OTP code format.
        
        Args:
            otp_code: OTP code to validate
            
        Returns:
            Sanitized OTP code
            
        Raises:
            HTTPException if invalid
        """
        if not otp_code:
            raise HTTPException(
                status_code=400,
                detail="Codul 2FA este obligatoriu"
            )
        
        # Remove whitespace
        otp_code = otp_code.strip()
        
        # Check format (6 digits)
        if not re.match(r'^\d{6}$', otp_code):
            raise HTTPException(
                status_code=400,
                detail="Codul 2FA trebuie să conțină exact 6 cifre"
            )
        
        return otp_code


# Pydantic models with validation
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        PasswordValidator.validate(v)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    otp_code: str = Field(..., regex=r'^\d{6}$')


class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    password: str = Field(..., min_length=1, description="Current password for confirmation")


class UpdatePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        PasswordValidator.validate(v)
        return v
