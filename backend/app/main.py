from fastapi import FastAPI, File, UploadFile, HTTPException, Header
import json
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.auth import register_user, login_user, request_password_reset, verify_reset_token, reset_password
from app.model import get_model
from app.nutrition import get_nutrition_info, format_nutrition_response, get_ingredient_suggestions
from app.ollama_client import generate_suggestions, generate_recipes_from_ingredients, generate_restaurant_query, generate_vitamin_advice
from app.database import (
    food_analyses_collection, 
    user_profiles_collection, 
    users_collection,
    user_goals_collection,
    weight_history_collection,
    notifications_collection,
    notification_preferences_collection,
    water_intake_collection
)
from passlib.hash import pbkdf2_sha256
from PIL import Image
import io
import base64
from bson import ObjectId
from app.scheduler import start_scheduler, stop_scheduler
from app.email_service import email_service


# Load environment variables
load_dotenv()


def _read_model_threshold() -> float:
    raw_threshold = os.getenv("MODEL_THRESHOLD", "0.3")
    try:
        value = float(raw_threshold)
    except ValueError:
        print(f"Warning: invalid MODEL_THRESHOLD '{raw_threshold}', fallback to 0.3")
        value = 0.3
    return max(0.01, min(value, 0.99))


MODEL_THRESHOLD = _read_model_threshold()

app = FastAPI()


def _compute_utc_range_for_local_date(date_str: Optional[str], tz_offset_minutes: Optional[int]):
    """
    Given a local date string (YYYY-MM-DD) and a JS-style timezone offset in minutes
    (as returned by `new Date().getTimezoneOffset()`), compute the UTC start/end
    datetimes that correspond to that local date.

    Returns (utc_start, utc_end) as naive UTC datetimes.
    """
    if date_str:
        try:
            local_date = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            # Fallback to fromisoformat for more flexible parsing
            local_date = datetime.fromisoformat(date_str)
    else:
        now = datetime.utcnow()
        local_date = datetime(now.year, now.month, now.day)

    if tz_offset_minutes is None:
        tz_offset_minutes = 0

    # JS getTimezoneOffset() is minutes to add to local to get UTC: UTC = local + offset
    # Therefore UTC start = local_midnight + offset minutes
    utc_start = local_date + timedelta(minutes=tz_offset_minutes)
    utc_end = utc_start + timedelta(days=1)
    return utc_start, utc_end


def _parse_timestamp_to_datetime(ts):
    if isinstance(ts, datetime):
        return ts
    if isinstance(ts, str):
        try:
            # Handle Z suffix
            if ts.endswith('Z'):
                return datetime.fromisoformat(ts.replace('Z', '+00:00')).replace(tzinfo=None)
            dt = datetime.fromisoformat(ts)
            # If datetime has tzinfo, convert to naive UTC
            if dt.tzinfo is not None:
                return dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        except Exception:
            try:
                return datetime.strptime(ts[:19], "%Y-%m-%dT%H:%M:%S")
            except Exception:
                return None
    return None

# Allow CORS for frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load ML model and start scheduler on startup"""
    try:
        model = get_model()
        print("[OK] Food recognition model loaded successfully")
    except Exception as e:
        print(f"[Warning] Model loading issue - {e}")
    
    # Start background scheduler for reminders
    try:
        start_scheduler()
        print("[OK] Background scheduler started")
    except Exception as e:
        print(f"[Warning] Scheduler startup issue - {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    try:
        stop_scheduler()
        print("✅ Background scheduler stopped")
    except Exception as e:
        print(f"⚠️ Warning: Scheduler shutdown issue - {e}")


def create_thumbnail(image_bytes: bytes, size: tuple = (150, 150)) -> str:
    """
    Create a Base64-encoded thumbnail from image bytes.
    
    Args:
        image_bytes: Raw image bytes
        size: Thumbnail size (width, height)
        
    Returns:
        Base64-encoded thumbnail or empty string if conversion fails
    """
    try:
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        # Create thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Convert to bytes
        thumb_bytes = io.BytesIO()
        img.save(thumb_bytes, format='JPEG', quality=70)
        thumb_bytes.seek(0)
        
        # Encode to Base64
        thumb_base64 = base64.b64encode(thumb_bytes.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{thumb_base64}"
    except Exception as e:
        print(f"⚠️ Warning: Thumbnail creation failed - {e}")
        return ""


@app.post("/analyze_food/")
async def analyze_food(
    file: UploadFile = File(...),
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Analyze uploaded food image to detect ingredients and calculate nutrition.
    Saves analysis to database if user is authenticated.
    
    Args:
        file: Uploaded image file (JPG, PNG, etc.)
        user_email: User email from header (optional, for authenticated users)
        
    Returns:
        JSON with detected ingredients and nutritional information
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Get ML model and predict food + ingredients
        model = get_model()
        prediction_result = model.predict(image_bytes, threshold=MODEL_THRESHOLD)
        
        food_name = prediction_result.get("food_name", "unknown")
        detected_ingredients = prediction_result.get("ingredients", [])
        confidence = prediction_result.get("confidence", 0.0)
        
        # Get nutritional information
        nutrition_data = get_nutrition_info(detected_ingredients)
        formatted_nutrition = format_nutrition_response(nutrition_data)
        
        # Save analysis to database if user is authenticated
        analysis_id = None
        if user_email:
            try:
                # Create thumbnail for preview
                thumbnail = create_thumbnail(image_bytes, size=(150, 150))
                
                analysis_document = {
                    "user_email": user_email,
                    "timestamp": datetime.utcnow(),
                    "food_name": food_name,
                    "confidence": confidence,
                    "ingredients": detected_ingredients,
                    "nutrition": nutrition_data,
                    "image_name": file.filename,
                    "image_size": len(image_bytes),
                    "image_thumbnail": thumbnail
                }
                result = food_analyses_collection.insert_one(analysis_document)
                analysis_id = str(result.inserted_id)
                print(f"✅ Analysis saved to database for user: {user_email}")
                
                # Create notification for analysis completion
                try:
                    display_food_name = food_name.replace("_", " ").strip().title() if food_name else "Your meal"
                    notification_data = {
                        "user_email": user_email,
                        "type": "analysis_complete",
                        "title": f"{display_food_name} analysis complete! 🎉",
                        "message": f"Great news! We've identified {len(detected_ingredients)} ingredients in your {display_food_name}. Tap here to see the full nutritional breakdown.",
                        "data": {
                            "analysis_id": analysis_id,
                            "food_name": food_name,
                            "ingredients_count": len(detected_ingredients)
                        },
                        "timestamp": datetime.utcnow(),
                        "is_read": False
                    }
                    notifications_collection.insert_one(notification_data)
                    print(f"✅ Notification created for user: {user_email}")
                    
                    # Send email notification if enabled in preferences
                    try:
                        from app.notifications import should_notify
                        if should_notify(user_email, "analysis_complete"):
                            email_service.send_analysis_complete_email(
                                recipient_email=user_email,
                                food_name=food_name,
                                ingredients=detected_ingredients,
                                ingredients_count=len(detected_ingredients)
                            )
                            print(f"✅ Email sent to user: {user_email}")
                    except Exception as email_error:
                        print(f"⚠️ Warning: Could not send email: {email_error}")
                        
                except Exception as notif_error:
                    print(f"⚠️ Warning: Could not create notification: {notif_error}")
            except Exception as db_error:
                print(f"⚠️ Warning: Could not save analysis to database: {db_error}")
        
        return {
            "food_name": food_name,
            "confidence": round(confidence * 100, 2),
            "ingredients": detected_ingredients,
            "nutrition": nutrition_data,
            "formatted_text": formatted_nutrition,
            "analysis_id": analysis_id,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Error in analyze_food: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/calculate_nutrition/")
async def calculate_nutrition(data: dict):
    """
    Calculate nutritional information for a list of ingredients.
    Used for recalculating nutrition when ingredients are added/removed.
    
    Args:
        data: Dictionary containing 'ingredients' list
        
    Returns:
        JSON with nutritional information
    """
    try:
        ingredients = data.get("ingredients", [])
        
        if not ingredients:
            raise HTTPException(status_code=400, detail="No ingredients provided")
        
        # Get nutritional information
        nutrition_data = get_nutrition_info(ingredients)
        
        return nutrition_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating nutrition: {str(e)}")


@app.get("/ingredient_suggestions/")
async def ingredient_suggestions(search: str):
    """
    Get autocomplete suggestions for ingredients.
    
    Args:
        search: Search text for ingredient autocomplete
        
    Returns:
        List of matching ingredient names (max 10 results)
    """
    try:
        if not search or len(search.strip()) == 0:
            return {"suggestions": []}
        
        suggestions = get_ingredient_suggestions(search)
        return {"suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestions: {str(e)}")


class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str
    otp_code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/register")
def register(data: RegisterRequest):
    # accesezi câmpurile: data.email, data.password
    return register_user(data.email, data.password)

@app.post("/login")
def login(data: LoginRequest):
    return login_user(data.email, data.password, data.otp_code)

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    """
    Request a password reset email.
    
    Args:
        email: User's email address
        
    Returns:
        Status message (doesn't reveal if email exists for security)
    """
    return request_password_reset(data.email)

@app.get("/verify-reset-token/{token}")
def verify_token(token: str):
    """
    Verify if a password reset token is valid.
    
    Args:
        token: Reset token to verify
        
    Returns:
        Token validity status
    """
    return verify_reset_token(token)

@app.post("/reset-password")
def reset_pwd(data: ResetPasswordRequest):
    """
    Reset password using a valid reset token.
    
    Args:
        token: Valid password reset token
        new_password: New password
        
    Returns:
        Status of password reset
    """
    return reset_password(data.token, data.new_password)

@app.get("/analysis_history/{user_email}")
def get_analysis_history(user_email: str, limit: int = 100):
    """
    Get food analysis history for a specific user.
    
    Args:
        user_email: Email of the authenticated user
        limit: Maximum number of results to return (default: 100)
        
    Returns:
        List of past analyses with ingredients and nutrition data
    """
    try:
        # Query analyses for this user, sorted by most recent first
        analyses = list(food_analyses_collection.find(
            {"user_email": user_email}
        ).sort("timestamp", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for analysis in analyses:
            if "_id" in analysis:
                analysis["_id"] = str(analysis["_id"])
            if "timestamp" in analysis:
                analysis["timestamp"] = analysis["timestamp"].isoformat()
        
        return {
            "status": "success",
            "count": len(analyses),
            "analyses": analyses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: str, user_email: Optional[str] = Header(None, alias="X-User-Email")):
    """
    Delete a food analysis by ID.
    Only the owner of the analysis can delete it.
    
    Args:
        analysis_id: The ID of the analysis to delete
        user_email: Email of the authenticated user (from header)
        
    Returns:
        Success message
    """
    try:
        from bson.objectid import ObjectId
        
        if not user_email:
            raise HTTPException(status_code=401, detail="User email required")
        
        # Verify the analysis belongs to this user before deleting
        result = food_analyses_collection.delete_one({
            "_id": ObjectId(analysis_id),
            "user_email": user_email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Analysis not found or unauthorized")
        
        return {
            "status": "success",
            "message": "Analysis deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting analysis: {str(e)}")


@app.put("/analysis/{analysis_id}/favorite")
async def toggle_favorite(
    analysis_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Toggle favorite status for an analysis.
    
    Args:
        analysis_id: MongoDB ObjectId of the analysis
        user_email: User email from header
        
    Returns:
        Updated favorite status
    """
    try:
        from bson.objectid import ObjectId
        
        if not user_email:
            raise HTTPException(status_code=401, detail="User email required")
        
        # Get current analysis
        analysis = food_analyses_collection.find_one({
            "_id": ObjectId(analysis_id),
            "user_email": user_email
        })
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found or unauthorized")
        
        # Toggle favorite status
        current_favorite = analysis.get("is_favorite", False)
        new_favorite = not current_favorite
        
        # Update in database
        food_analyses_collection.update_one(
            {"_id": ObjectId(analysis_id)},
            {"$set": {"is_favorite": new_favorite}}
        )
        
        return {
            "status": "success",
            "is_favorite": new_favorite,
            "message": f"Analysis {'added to' if new_favorite else 'removed from'} favorites"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling favorite: {str(e)}")


# User Profile Models
class UserProfileData(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    sex: Optional[str] = None  # "male", "female", "other"


@app.get("/user_profile/{email}")
async def get_user_profile(email: str):
    """
    Get user profile data (personal information).
    
    Args:
        email: User's email address
        
    Returns:
        User profile data or empty object if not yet filled
    """
    try:
        profile = user_profiles_collection.find_one({"email": email})
        
        if not profile:
            # Return empty profile if not found
            return {
                "status": "success",
                "profile": {
                    "email": email,
                    "first_name": "",
                    "last_name": "",
                    "age": None,
                    "height": None,
                    "weight": None,
                    "sex": ""
                }
            }
        
        # Remove MongoDB _id from response
        if "_id" in profile:
            del profile["_id"]
        
        return {
            "status": "success",
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")


@app.put("/user_profile/{email}")
async def update_user_profile(email: str, profile_data: UserProfileData):
    """
    Update user profile data (personal information).
    
    Args:
        email: User's email address
        profile_data: Profile data to update
        
    Returns:
        Updated profile data
    """
    try:
        # Validate sex field if provided
        if profile_data.sex and profile_data.sex not in ["male", "female", "other", ""]:
            raise HTTPException(status_code=400, detail="Invalid sex value. Must be: male, female, or other")
        
        # Prepare update data (only include non-None fields)
        update_data = {"email": email}
        if profile_data.first_name is not None:
            update_data["first_name"] = profile_data.first_name
        if profile_data.last_name is not None:
            update_data["last_name"] = profile_data.last_name
        if profile_data.age is not None:
            update_data["age"] = profile_data.age
        if profile_data.height is not None:
            update_data["height"] = profile_data.height
        if profile_data.weight is not None:
            update_data["weight"] = profile_data.weight
        if profile_data.sex is not None:
            update_data["sex"] = profile_data.sex
        
        # Upsert (update if exists, insert if not)
        user_profiles_collection.update_one(
            {"email": email},
            {"$set": update_data},
            upsert=True
        )
        
        # Fetch and return updated profile
        updated_profile = user_profiles_collection.find_one({"email": email})
        if "_id" in updated_profile:
            del updated_profile["_id"]
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "profile": updated_profile
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


# Account Settings Models
class AccountSettingsData(BaseModel):
    current_password: str
    new_email: Optional[str] = None
    new_password: Optional[str] = None


@app.put("/account_settings/{email}")
async def update_account_settings(email: str, settings_data: AccountSettingsData):
    """
    Update account settings (email and/or password).
    User must provide current password for verification.
    
    Args:
        email: Current user's email address
        settings_data: New settings data including current password for verification
        
    Returns:
        Success message with updated email if changed
    """
    try:
        # Find user in database first
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password FIRST (before checking if changes are requested)
        stored_password_hash = user["password"]
        
        # Use passlib's pbkdf2_sha256 to verify (same as auth.py)
        if not pbkdf2_sha256.verify(settings_data.current_password, stored_password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # If only validating password (no changes requested), return success
        if not settings_data.new_email and not settings_data.new_password:
            return {
                "status": "success",
                "message": "Password validated successfully",
                "validation_only": True
            }
        
        # Prepare updates
        updates = {}
        new_email_value = email  # Default to current email
        
        # Update email if provided
        if settings_data.new_email and settings_data.new_email != email:
            # Check if new email already exists
            existing_user = users_collection.find_one({"email": settings_data.new_email})
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already in use")
            
            updates["email"] = settings_data.new_email
            new_email_value = settings_data.new_email
            
            # Also update email in user_profiles and food_analyses
            user_profiles_collection.update_one(
                {"email": email},
                {"$set": {"email": settings_data.new_email}}
            )
            # Note: For food_analyses, we keep the old email for historical accuracy
            # but you could update if needed
        
        # Update password if provided
        if settings_data.new_password:
            # Hash the new password using passlib (same as registration)
            new_password_hash = pbkdf2_sha256.hash(settings_data.new_password)
            updates["password"] = new_password_hash
        
        # Apply updates to users collection
        if updates:
            users_collection.update_one(
                {"email": email},
                {"$set": updates}
            )
        
        return {
            "status": "success",
            "message": "Account settings updated successfully",
            "new_email": new_email_value
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating account settings: {str(e)}")


# ============================================
# GOALS & TRACKING SYSTEM
# ============================================

def calculate_bmr(weight_kg, height_cm, age, sex):
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation.
    
    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters
        age: Age in years
        sex: "male" or "female"
        
    Returns:
        BMR in calories per day
    """
    if sex.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:  # female
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return round(bmr, 1)


def calculate_tdee(bmr, activity_level):
    """
    Calculate Total Daily Energy Expenditure.
    
    Args:
        bmr: Basal Metabolic Rate
        activity_level: One of: sedentary, light, moderate, active, very_active
        
    Returns:
        TDEE in calories per day
    """
    multipliers = {
        "sedentary": 1.2,      # Little to no exercise
        "light": 1.375,         # Light exercise 1-3 days/week
        "moderate": 1.55,       # Moderate exercise 3-5 days/week
        "active": 1.725,        # Hard exercise 6-7 days/week
        "very_active": 1.9      # Very hard exercise, physical job
    }
    multiplier = multipliers.get(activity_level, 1.2)
    return round(bmr * multiplier, 1)


class UserGoalsData(BaseModel):
    goal_type: str  # "lose_weight", "maintain", "gain_weight", "build_muscle"
    activity_level: str  # "sedentary", "light", "moderate", "active", "very_active"
    target_calories: Optional[int] = None
    target_protein: Optional[int] = None
    target_carbs: Optional[int] = None
    target_fat: Optional[int] = None
    target_weight: Optional[float] = None  # Goal weight in kg
    weekly_goal: Optional[float] = None  # kg per week (e.g., -0.5 for loss, +0.3 for gain)


@app.get("/user_goals/{email}")
async def get_user_goals(email: str):
    """
    Get user's nutrition goals and calculate BMR/TDEE if profile exists.
    
    Args:
        email: User's email address
        
    Returns:
        User goals with calculated BMR/TDEE
    """
    try:
        # Get user goals
        goals = user_goals_collection.find_one({"email": email})
        
        # Get user profile for BMR/TDEE calculation
        profile = user_profiles_collection.find_one({"email": email})
        
        calculated_data = {}
        
        # Calculate BMR and TDEE if profile has required data
        if profile and all(k in profile and profile[k] for k in ["weight", "height", "age", "sex"]):
            bmr = calculate_bmr(
                profile["weight"],
                profile["height"],
                profile["age"],
                profile["sex"]
            )
            calculated_data["bmr"] = bmr
            
            # Calculate TDEE if activity level is set
            if goals and "activity_level" in goals:
                tdee = calculate_tdee(bmr, goals["activity_level"])
                calculated_data["tdee"] = tdee
                calculated_data["maintenance_calories"] = tdee
        
        if not goals:
            # Return defaults if no goals set
            return {
                "status": "success",
                "goals": {
                    "email": email,
                    "goal_type": "maintain",
                    "activity_level": "moderate",
                    "target_calories": calculated_data.get("tdee", 2000),
                    "target_protein": 150,
                    "target_carbs": 200,
                    "target_fat": 65
                },
                "calculated": calculated_data,
                "has_goals": False
            }
        
        # Remove MongoDB _id from response
        if "_id" in goals:
            del goals["_id"]
        
        return {
            "status": "success",
            "goals": goals,
            "calculated": calculated_data,
            "has_goals": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")


@app.put("/user_goals/{email}")
async def update_user_goals(email: str, goals_data: UserGoalsData):
    """
    Update or create user's nutrition goals.
    
    Args:
        email: User's email address
        goals_data: Goals data to update
        
    Returns:
        Updated goals with calculated recommendations
    """
    try:
        # Prepare update data
        update_data = {
            "email": email,
            "goal_type": goals_data.goal_type,
            "activity_level": goals_data.activity_level,
            "updated_at": datetime.utcnow()
        }
        
        # Add optional fields if provided
        if goals_data.target_calories is not None:
            update_data["target_calories"] = goals_data.target_calories
        if goals_data.target_protein is not None:
            update_data["target_protein"] = goals_data.target_protein
        if goals_data.target_carbs is not None:
            update_data["target_carbs"] = goals_data.target_carbs
        if goals_data.target_fat is not None:
            update_data["target_fat"] = goals_data.target_fat
        if goals_data.target_weight is not None:
            update_data["target_weight"] = goals_data.target_weight
        if goals_data.weekly_goal is not None:
            update_data["weekly_goal"] = goals_data.weekly_goal
        
        # Upsert goals
        user_goals_collection.update_one(
            {"email": email},
            {"$set": update_data},
            upsert=True
        )
        
        # Fetch and return updated goals
        updated_goals = user_goals_collection.find_one({"email": email})
        if "_id" in updated_goals:
            del updated_goals["_id"]
        
        # Calculate BMR/TDEE for recommendations
        profile = user_profiles_collection.find_one({"email": email})
        calculated_data = {}
        
        if profile and all(k in profile and profile[k] for k in ["weight", "height", "age", "sex"]):
            bmr = calculate_bmr(
                profile["weight"],
                profile["height"],
                profile["age"],
                profile["sex"]
            )
            tdee = calculate_tdee(bmr, goals_data.activity_level)
            calculated_data = {
                "bmr": bmr,
                "tdee": tdee,
                "maintenance_calories": tdee
            }
        
        return {
            "status": "success",
            "message": "Goals updated successfully",
            "goals": updated_goals,
            "calculated": calculated_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goals: {str(e)}")

@app.get("/suggest_meals/{user_email}")
async def suggest_meals(user_email: str, date: Optional[str] = None, tz_offset: Optional[int] = None):
    """
    Suggest meals based on missing nutrients for the day.
    """
    try:
        # 1. Fetch user goals
        goals_response = await get_user_goals(user_email)
        goals = goals_response.get("goals", {})
        
        target_calories = goals.get("target_calories", 2000)
        target_protein = goals.get("target_protein", 150)
        target_carbs = goals.get("target_carbs", 200)
        target_fat = goals.get("target_fat", 65)
        
        # 2. Fetch today's history
        # Accept optional query params `date` (YYYY-MM-DD) and `tz_offset` (minutes as in JS getTimezoneOffset)
        # so callers can pass their local date and timezone offset. FastAPI will map these from query params.
        utc_start, utc_end = _compute_utc_range_for_local_date(date, tz_offset)

        # Fetch all for user and filter in Python to support both Mock and Real DB
        analyses_cursor = food_analyses_collection.find({"user_email": user_email})
        analyses = list(analyses_cursor) if not isinstance(analyses_cursor, list) else analyses_cursor

        # 3. Calculate consumed
        consumed = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}

        for analysis in analyses:
            ts = analysis.get("timestamp")
            dt = _parse_timestamp_to_datetime(ts)
            if not dt:
                continue
            if dt >= utc_start and dt < utc_end:
                nut = analysis.get("nutrition", {})
                # support both 'total_nutrition' and 'nutrition' shapes
                total_nut = nut.get("total_nutrition") if isinstance(nut, dict) and "total_nutrition" in nut else nut
                consumed["calories"] += total_nut.get("calories", 0)
                consumed["protein"] += total_nut.get("protein", 0)
                consumed["carbs"] += total_nut.get("carbs", 0)
                consumed["fat"] += total_nut.get("fat", 0)
            
        # 4. Calculate missing
        missing = {
            "calories": max(0, round(target_calories - consumed["calories"], 2)),
            "protein": max(0, round(target_protein - consumed["protein"], 2)),
            "carbs": max(0, round(target_carbs - consumed["carbs"], 2)),
            "fat": max(0, round(target_fat - consumed["fat"], 2))
        }
        
        # 5. Get suggestions from Ollama
        suggestions = []
        if missing["calories"] > 0 or missing["protein"] > 0 or missing["carbs"] > 0 or missing["fat"] > 0:
            suggestions_str = generate_suggestions(missing)
            try:
                suggestions = json.loads(suggestions_str)
            except json.JSONDecodeError:
                print(f"Failed to parse suggestions JSON: {suggestions_str}")
                suggestions = [{"name": "AI Suggestion (Fallback)", "recipe": suggestions_str}]
            
        return {
            "status": "success",
            "target": {
                "calories": target_calories,
                "protein": target_protein,
                "carbs": target_carbs,
                "fat": target_fat
            },
            "consumed": {k: round(v, 2) for k, v in consumed.items()},
            "missing": missing,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error suggesting meals: {str(e)}")


class RecipeRequest(BaseModel):
    ingredients: list[str]

@app.post("/generate_recipes")
async def generate_recipes(request: RecipeRequest):
    """
    Generate recipes based on a list of ingredients.
    """
    try:
        recipes_str = generate_recipes_from_ingredients(request.ingredients)
        try:
            recipes = json.loads(recipes_str)
        except json.JSONDecodeError:
            print(f"Failed to parse recipes JSON: {recipes_str}")
            recipes = [{"name": "AI Recipe (Fallback)", "recipe": recipes_str, "missing_ingredients": []}]
            
        return {
            "status": "success",
            "recipes": recipes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recipes: {str(e)}")


@app.get("/get_restaurant_query/{user_email}")
async def get_restaurant_query(user_email: str, date: Optional[str] = None, tz_offset: Optional[int] = None):
    """
    Get a search query for restaurants based on missing nutrients.
    """
    try:
        goals = user_goals_collection.find_one({"email": user_email})
        if not goals:
            target = {"calories": 2000, "carbs": 200, "fat": 65, "protein": 150}
        else:
            target = {
                "calories": goals.get("target_calories", 2000),
                "carbs": goals.get("target_carbs", 200),
                "fat": goals.get("target_fat", 65),
                "protein": goals.get("target_protein", 150)
            }
            
        analyses = list(food_analyses_collection.find({"user_email": user_email}))
        # Compute UTC range for the requested local date
        utc_start, utc_end = _compute_utc_range_for_local_date(date, tz_offset)

        today_analyses = []
        for a in analyses:
            ts = a.get("timestamp")
            dt = _parse_timestamp_to_datetime(ts)
            if not dt:
                continue
            if dt >= utc_start and dt < utc_end:
                today_analyses.append(a)
        
        consumed = {"calories": 0, "carbs": 0, "fat": 0, "protein": 0}
        for a in today_analyses:
            nutrients = a.get("nutrition_info", {})
            consumed["calories"] += nutrients.get("calories", 0)
            consumed["carbs"] += nutrients.get("carbohydrates", 0)
            consumed["fat"] += nutrients.get("fat", 0)
            consumed["protein"] += nutrients.get("protein", 0)
            
        missing = {
            "calories": max(0, target["calories"] - consumed["calories"]),
            "carbs": max(0, target["carbs"] - consumed["carbs"]),
            "fat": max(0, target["fat"] - consumed["fat"]),
            "protein": max(0, target["protein"] - consumed["protein"])
        }
        
        query = generate_restaurant_query(missing)
        
        return {
            "status": "success",
            "query": query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating restaurant query: {str(e)}")


class WeightEntry(BaseModel):
    weight: float  # in kg
    date: Optional[str] = None  # ISO date string, defaults to today
    notes: Optional[str] = None


@app.post("/weight_history/{email}")
async def add_weight_entry(email: str, entry: WeightEntry):
    """
    Add a weight measurement to history.
    
    Args:
        email: User's email address
        entry: Weight entry data
        
    Returns:
        Created entry with ID
    """
    try:
        # Use provided date or current date
        entry_date = entry.date if entry.date else datetime.utcnow().isoformat()
        
        weight_document = {
            "email": email,
            "weight": entry.weight,
            "date": entry_date,
            "notes": entry.notes,
            "created_at": datetime.utcnow()
        }
        
        result = weight_history_collection.insert_one(weight_document)
        
        # Also update current weight in user profile
        user_profiles_collection.update_one(
            {"email": email},
            {"$set": {"weight": entry.weight, "last_weight_update": datetime.utcnow()}},
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Weight entry added successfully",
            "entry_id": str(result.inserted_id),
            "weight": entry.weight,
            "date": entry_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding weight entry: {str(e)}")


@app.get("/weight_history/{email}")
async def get_weight_history(email: str, limit: int = 100):
    """
    Get weight history for a user.
    
    Args:
        email: User's email address
        limit: Maximum number of entries to return
        
    Returns:
        List of weight entries sorted by date
    """
    try:
        entries = list(weight_history_collection.find(
            {"email": email}
        ).sort("date", -1).limit(limit))
        
        # Convert ObjectId to string
        for entry in entries:
            if "_id" in entry:
                entry["_id"] = str(entry["_id"])
            if "created_at" in entry and hasattr(entry["created_at"], "isoformat"):
                entry["created_at"] = entry["created_at"].isoformat()
        
        return {
            "status": "success",
            "count": len(entries),
            "entries": entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weight history: {str(e)}")


@app.delete("/weight_history/{entry_id}")
async def delete_weight_entry(entry_id: str, email: Optional[str] = Header(None, alias="X-User-Email")):
    """
    Delete a weight history entry.
    
    Args:
        entry_id: The ID of the entry to delete
        email: User's email (from header)
        
    Returns:
        Success message
    """
    try:
        from bson.objectid import ObjectId
        
        if not email:
            raise HTTPException(status_code=401, detail="User email required")
        
        result = weight_history_collection.delete_one({
            "_id": ObjectId(entry_id),
            "email": email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found or unauthorized")
        
        return {
            "status": "success",
            "message": "Weight entry deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting entry: {str(e)}")


@app.get("/streak/{email}")
async def get_user_streak(email: str, date: Optional[str] = None, tz_offset: Optional[int] = None):
    """
    Calculate user's meal tracking streak (consecutive days with analyses).
    
    Args:
        email: User's email address
        
    Returns:
        Current streak and longest streak
    """
    try:
        # Get all analyses sorted by date
        analyses = list(food_analyses_collection.find(
            {"user_email": email}
        ).sort("timestamp", -1))
        
        if not analyses:
            return {
                "status": "success",
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity": None
            }
        
        # Extract unique local dates (respecting user's tz_offset if provided)
        dates_set = set()
        for analysis in analyses:
            if "timestamp" in analysis:
                ts = analysis["timestamp"]
                dt = _parse_timestamp_to_datetime(ts)
                if not dt:
                    continue
                if tz_offset is not None:
                    # Convert UTC timestamp to user's local time: local = UTC - tzOffset
                    local_dt = dt - timedelta(minutes=tz_offset)
                else:
                    local_dt = dt
                dates_set.add(str(local_dt.date()))

        dates_list = sorted(list(dates_set), reverse=True)

        # Calculate current streak using user's local 'today' if provided
        if date:
            try:
                today = datetime.strptime(date, "%Y-%m-%d").date()
            except Exception:
                today = datetime.fromisoformat(date).date()
        else:
            # use server UTC date as fallback
            today = datetime.utcnow().date()

        current_streak = 0
        for i, date_str in enumerate(dates_list):
            expected_date = today - timedelta(days=i)
            if str(expected_date) == date_str or str(expected_date)[:10] == date_str[:10]:
                current_streak += 1
            else:
                break
        
        # Calculate longest streak
        longest_streak = 1
        temp_streak = 1
        
        for i in range(1, len(dates_list)):
            prev_date = datetime.fromisoformat(dates_list[i-1][:10])
            curr_date = datetime.fromisoformat(dates_list[i][:10])
            diff = (prev_date - curr_date).days
            
            if diff == 1:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1
        
        return {
            "status": "success",
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_activity": dates_list[0] if dates_list else None,
            "total_days_active": len(dates_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating streak: {str(e)}")


# ==================== NOTIFICATION ENDPOINTS ====================

@app.get("/notifications/{user_email}")
def get_notifications(user_email: str, limit: int = 50, unread_only: bool = False):
    """
    Get notifications for a user.
    
    Args:
        user_email: User's email address
        limit: Maximum number of notifications to return
        unread_only: If True, only return unread notifications
        
    Returns:
        List of notifications with unread count
    """
    try:
        # Get notifications
        notifications = list(notifications_collection.find(
            {"user_email": user_email} if not unread_only else {"user_email": user_email, "is_read": False}
        ).sort("timestamp", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for notification in notifications:
            if "_id" in notification:
                notification["_id"] = str(notification["_id"])
            if "timestamp" in notification:
                notification["timestamp"] = notification["timestamp"].isoformat()
        
        # Get unread count
        unread_count = len(list(notifications_collection.find(
            {"user_email": user_email, "is_read": False}
        )))
        
        return {
            "status": "success",
            "notifications": notifications,
            "unread_count": unread_count,
            "total_count": len(notifications)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")


@app.post("/notifications/{user_email}")
def create_notification_endpoint(
    user_email: str,
    notification_type: str,
    title: str,
    message: str
):
    """
    Create a new notification for a user.
    
    Args:
        user_email: User's email address
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        
    Returns:
        Created notification details
    """
    try:
        notification_data = {
            "user_email": user_email,
            "type": notification_type,
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow(),
            "is_read": False
        }
        
        result = notifications_collection.insert_one(notification_data)
        
        return {
            "status": "success",
            "notification_id": str(result.inserted_id),
            "message": "Notification created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """
    Mark a notification as read.
    
    Args:
        notification_id: ID of the notification to mark as read
        
    Returns:
        Success status
    """
    try:
        result = notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "status": "success",
            "message": "Notification marked as read"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification: {str(e)}")


@app.delete("/notifications/{notification_id}")
def delete_notification_endpoint(notification_id: str):
    """
    Delete a notification.
    
    Args:
        notification_id: ID of the notification to delete
        
    Returns:
        Success status
    """
    try:
        result = notifications_collection.delete_one({"_id": ObjectId(notification_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "status": "success",
            "message": "Notification deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")


@app.get("/notification_preferences/{email}")
def get_notification_preferences_endpoint(email: str):
    """
    Get notification preferences for a user.
    
    Args:
        email: User's email address
        
    Returns:
        User's notification preferences
    """
    try:
        prefs = notification_preferences_collection.find_one({"email": email})
        
        if not prefs:
            # Return default preferences
            default_prefs = {
                "analysis_complete": True,
                "goal_achieved": True,
                "daily_reminder": True,
                "weight_reminder": True
            }
            return {
                "status": "success",
                "preferences": default_prefs
            }
        
        return {
            "status": "success",
            "preferences": prefs.get("preferences", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preferences: {str(e)}")


@app.post("/notification_preferences/{email}")
def set_notification_preferences_endpoint(email: str, preferences: dict):
    """
    Set notification preferences for a user.
    
    Args:
        email: User's email address
        preferences: Dictionary of notification preferences
        
    Returns:
        Success status
    """
    try:
        result = notification_preferences_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "preferences": preferences,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Notification preferences updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")


@app.get("/get_water_intake/{email}")
def get_water_intake_endpoint(email: str, date: Optional[str] = None):
    """
    Get today's water intake for a user.
    """
    try:
        today = date if date else datetime.utcnow().strftime("%Y-%m-%d")
        records = water_intake_collection.find({"user_email": email, "date": today})
        
        total = 0.0
        for r in records:
            total += r.get("amount", 0.0)
            
        return {
            "status": "success",
            "total": total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching water intake: {str(e)}")


@app.post("/add_water_intake")
def add_water_intake_endpoint(data: dict):
    """
    Add water intake for a user.
    """
    try:
        email = data.get("email")
        amount = data.get("amount")
        if not email or amount is None:
            raise HTTPException(status_code=400, detail="Missing email or amount")

        # Allow frontend to provide the local date string (YYYY-MM-DD) so water entries
        # can be grouped by user's local day. If not provided, fall back to server UTC date.
        provided_date = data.get("date")
        today = provided_date if provided_date else datetime.utcnow().strftime("%Y-%m-%d")

        record = water_intake_collection.find_one({"user_email": email, "date": today})

        if record:
            new_total = max(0.0, record.get("amount", 0.0) + amount)
            water_intake_collection.update_one(
                {"_id": record["_id"]},
                {"$set": {"amount": new_total, "timestamp": datetime.utcnow()}}
            )
        else:
            water_intake_collection.insert_one({
                "user_email": email,
                "date": today,
                "amount": amount,
                "timestamp": datetime.utcnow()
            })
            
        return {
            "status": "success",
            "message": "Water intake updated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating water intake: {str(e)}")


@app.get("/vitamin_advice/{email}")
def get_vitamin_advice_endpoint(email: str, date: Optional[str] = None, tz_offset: Optional[int] = None):
    """
    Get advice on missing vitamins based on today's missing nutrients.
    """
    try:
        # Fetch goals
        goals_doc = user_goals_collection.find_one({"email": email})
        if not goals_doc:
            goals = {
                "target_calories": 2000,
                "target_protein": 150,
                "target_carbs": 200,
                "target_fat": 65
            }
        else:
            goals = goals_doc.get("goals", {})
            
        # Fetch progress for the requested local date
        utc_start, utc_end = _compute_utc_range_for_local_date(date, tz_offset)
        records = food_analyses_collection.find({"user_email": email})

        # Filter for the UTC range corresponding to the local date and calculate totals
        consumed = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        for r in records:
            dt = _parse_timestamp_to_datetime(r.get("timestamp"))
            if not dt:
                continue
            if dt >= utc_start and dt < utc_end:
                nutrients = r.get("nutrients", {})
                consumed["calories"] += nutrients.get("calories", 0)
                consumed["protein"] += nutrients.get("protein", 0)
                consumed["carbs"] += nutrients.get("carbs", 0)
                consumed["fat"] += nutrients.get("fat", 0)
                
        # Calculate missing
        missing = {
            "calories": max(0, goals.get("target_calories", 2000) - consumed["calories"]),
            "protein": max(0, goals.get("target_protein", 150) - consumed["protein"]),
            "carbs": max(0, goals.get("target_carbs", 200) - consumed["carbs"]),
            "fat": max(0, goals.get("target_fat", 65) - consumed["fat"])
        }
        
        # Generate advice
        advice = generate_vitamin_advice(missing)
        
        return {
            "status": "success",
            "advice": advice
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating vitamin advice: {str(e)}")


