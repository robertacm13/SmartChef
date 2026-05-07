"""
Background scheduler for SmartChef notifications.
Handles scheduled tasks like daily reminders and weekly summaries.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from app.database import users_collection, notifications_collection
from app.notifications import create_notification, should_notify
import logging

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = BackgroundScheduler()


def send_daily_reminders():
    """
    Send daily reminders to all users who have enabled daily_reminder notifications.
    Runs at 09:00 AM every day.
    """
    try:
        # Get all users
        users = list(users_collection.find({}))
        
        reminder_count = 0
        for user in users:
            email = user.get('email')
            if not email:
                continue
            
            # Check if user has enabled daily reminders
            if should_notify(email, 'daily_reminder'):
                try:
                    create_notification(
                        user_email=email,
                        notification_type='daily_reminder',
                        title='📅 Daily Reminder',
                        message="Don't forget to log your meal today!",
                        data={'type': 'daily_reminder'}
                    )
                    reminder_count += 1
                except Exception as e:
                    logger.error(f"Error sending reminder to {email}: {e}")
        
        logger.info(f"✅ Daily reminders sent to {reminder_count} users")
    except Exception as e:
        logger.error(f"Error in send_daily_reminders: {e}")


def send_weight_reminders():
    """
    Send weight tracking reminders to all users who have enabled weight_reminder notifications.
    Runs at 08:00 PM every day.
    """
    try:
        # Get all users
        users = list(users_collection.find({}))
        
        reminder_count = 0
        for user in users:
            email = user.get('email')
            if not email:
                continue
            
            # Check if user has enabled weight reminders
            if should_notify(email, 'weight_reminder'):
                try:
                    create_notification(
                        user_email=email,
                        notification_type='weight_reminder',
                        title='⚖️ Weight Tracking Reminder',
                        message='It\'s a good time to log your weight.',
                        data={'type': 'weight_reminder'}
                    )
                    reminder_count += 1
                except Exception as e:
                    logger.error(f"Error sending weight reminder to {email}: {e}")
        
        logger.info(f"✅ Weight reminders sent to {reminder_count} users")
    except Exception as e:
        logger.error(f"Error in send_weight_reminders: {e}")


def start_scheduler():
    """
    Start the background scheduler with configured jobs.
    """
    try:
        # Add job for daily reminders (9:00 AM every day)
        scheduler.add_job(
            send_daily_reminders,
            CronTrigger(hour=9, minute=0),
            id='daily_reminders',
            name='Daily meal reminders',
            replace_existing=True,
            max_instances=1
        )
        
        # Add job for weight reminders (8:00 PM every day)
        scheduler.add_job(
            send_weight_reminders,
            CronTrigger(hour=20, minute=0),
            id='weight_reminders',
            name='Weight tracking reminders',
            replace_existing=True,
            max_instances=1
        )
        
        if not scheduler.running:
            scheduler.start()
            logger.info("✅ Notification scheduler started successfully")
        else:
            logger.info("⚠️ Scheduler is already running")
            
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")


def stop_scheduler():
    """
    Stop the background scheduler.
    """
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("✅ Notification scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")


def get_scheduler_status():
    """
    Get the current status of the scheduler.
    """
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None
            }
            for job in scheduler.get_jobs()
        ]
    }
