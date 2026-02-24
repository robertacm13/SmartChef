from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.auth import register_user, login_user
from app.model import get_model
from app.nutrition import get_nutrition_info, format_nutrition_response
from app.database import (
    food_analyses_collection, 
    user_profiles_collection, 
    users_collection,
    user_goals_collection,
    weight_history_collection
)
from passlib.hash import pbkdf2_sha256


# Load environment variables
load_dotenv()

app = FastAPI()

# Allow CORS for frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load ML model on startup"""
    try:
        model = get_model()
        print("✅ Food recognition model loaded successfully")
    except Exception as e:
        print(f"⚠️ Warning: Model loading issue - {e}")


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
        
        # Get ML model and predict ingredients
        model = get_model()
        detected_ingredients = model.predict(image_bytes, threshold=0.3)
        
        # Get nutritional information
        nutrition_data = get_nutrition_info(detected_ingredients)
        formatted_nutrition = format_nutrition_response(nutrition_data)
        
        # Save analysis to database if user is authenticated
        analysis_id = None
        if user_email:
            try:
                analysis_document = {
                    "user_email": user_email,
                    "timestamp": datetime.utcnow(),
                    "ingredients": detected_ingredients,
                    "nutrition": nutrition_data,
                    "image_name": file.filename,
                    "image_size": len(image_bytes)
                }
                result = food_analyses_collection.insert_one(analysis_document)
                analysis_id = str(result.inserted_id)
                print(f"✅ Analysis saved to database for user: {user_email}")
            except Exception as db_error:
                print(f"⚠️ Warning: Could not save analysis to database: {db_error}")
        
        return {
            "ingredients": detected_ingredients,
            "nutrition": nutrition_data,
            "formatted_text": formatted_nutrition,
            "analysis_id": analysis_id,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str
    otp_code: str

@app.post("/register")
def register(data: RegisterRequest):
    # accesezi câmpurile: data.email, data.password
    return register_user(data.email, data.password)

@app.post("/login")
def login(data: LoginRequest):
    return login_user(data.email, data.password, data.otp_code)

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
async def get_user_streak(email: str):
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
        
        # Extract unique dates
        dates_set = set()
        for analysis in analyses:
            if "timestamp" in analysis:
                date_str = analysis["timestamp"].date() if hasattr(analysis["timestamp"], "date") else analysis["timestamp"][:10]
                dates_set.add(str(date_str))
        
        dates_list = sorted(list(dates_set), reverse=True)
        
        # Calculate current streak
        current_streak = 0
        today = datetime.utcnow().date()
        
        for i, date_str in enumerate(dates_list):
            expected_date = today - datetime.timedelta(days=i)
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating account settings: {str(e)}")

