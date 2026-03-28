"""
Notification service for SmartChef app.
Handles creating, retrieving, and managing user notifications.
"""

from app.database import notifications_collection, notification_preferences_collection
from datetime import datetime
from bson import ObjectId
from typing import Optional, List


def create_notification(
    user_email: str,
    notification_type: str,
    title: str,
    message: str,
    data: Optional[dict] = None
) -> str:
    """
    Create a new notification for a user.
    
    Args:
        user_email: User's email address
        notification_type: Type of notification (analysis_complete, goal_achieved, daily_reminder, etc.)
        title: Notification title
        message: Notification message
        data: Optional additional data (e.g., analysis_id, food_name)
        
    Returns:
        ID of created notification
    """
    notification = {
        "user_email": user_email,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": datetime.utcnow(),
        "is_read": False
    }
    
    result = notifications_collection.insert_one(notification)
    return str(result.inserted_id)


def get_user_notifications(user_email: str, limit: int = 50, unread_only: bool = False) -> List[dict]:
    """
    Get notifications for a specific user.
    
    Args:
        user_email: User's email address
        limit: Maximum number of notifications to return
        unread_only: If True, only return unread notifications
        
    Returns:
        List of notifications
    """
    query = {"user_email": user_email}
    if unread_only:
        query["is_read"] = False
    
    notifications = list(notifications_collection.find(query).sort("timestamp", -1).limit(limit))
    
    # Convert ObjectId to string for JSON serialization
    for notification in notifications:
        if "_id" in notification:
            notification["_id"] = str(notification["_id"])
        if "timestamp" in notification:
            notification["timestamp"] = notification["timestamp"].isoformat()
    
    return notifications


def mark_notification_as_read(notification_id: str) -> bool:
    """
    Mark a notification as read.
    
    Args:
        notification_id: ID of the notification to mark as read
        
    Returns:
        True if successful, False otherwise
    """
    try:
        result = notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return False


def delete_notification(notification_id: str) -> bool:
    """
    Delete a notification.
    
    Args:
        notification_id: ID of the notification to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        result = notifications_collection.delete_one({"_id": ObjectId(notification_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return False


def get_unread_count(user_email: str) -> int:
    """
    Get count of unread notifications for a user.
    
    Args:
        user_email: User's email address
        
    Returns:
        Number of unread notifications
    """
    return notifications_collection.find({"user_email": user_email, "is_read": False}).count() if hasattr(notifications_collection.find({"user_email": user_email, "is_read": False}), 'count') else len(list(notifications_collection.find({"user_email": user_email, "is_read": False})))


def set_notification_preferences(email: str, preferences: dict) -> bool:
    """
    Set notification preferences for a user.
    
    Args:
        email: User's email address
        preferences: Dictionary of notification preferences
                    {
                        "analysis_complete": True/False,
                        "goal_achieved": True/False,
                        "daily_reminder": True/False,
                        "weight_reminder": True/False
                    }
        
    Returns:
        True if successful, False otherwise
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
        return True
    except Exception as e:
        print(f"Error setting notification preferences: {e}")
        return False


def get_notification_preferences(email: str) -> dict:
    """
    Get notification preferences for a user.
    
    Args:
        email: User's email address
        
    Returns:
        User's notification preferences or default preferences if not found
    """
    prefs = notification_preferences_collection.find_one({"email": email})
    
    if prefs:
        return prefs.get("preferences", {})
    
    # Return default preferences
    return {
        "analysis_complete": True,
        "goal_achieved": True,
        "daily_reminder": True,
        "weight_reminder": True
    }


def should_notify(email: str, notification_type: str) -> bool:
    """
    Check if a user should receive a specific type of notification.
    
    Args:
        email: User's email address
        notification_type: Type of notification (analysis_complete, goal_achieved, etc.)
        
    Returns:
        True if user has enabled this notification type
    """
    prefs = get_notification_preferences(email)
    return prefs.get(notification_type, True)  # Default to True if preference not found
