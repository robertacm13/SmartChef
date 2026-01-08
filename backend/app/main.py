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
from app.database import food_analyses_collection


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
def get_analysis_history(user_email: str, limit: int = 10):
    """
    Get food analysis history for a specific user.
    
    Args:
        user_email: Email of the authenticated user
        limit: Maximum number of results to return (default: 10)
        
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
