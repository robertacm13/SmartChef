import os
import logging
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class EmailService:
    """Service for sending emails with password reset links"""
    
    def __init__(self):
        self.use_resend = os.getenv("USE_RESEND_EMAIL", "false").lower() == "true"
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.sender_email = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")
        self.app_url = os.getenv("APP_URL", "http://localhost:3000")
        
        logger.info(f"Email Service initialization:")
        logger.info(f"   USE_RESEND_EMAIL: {self.use_resend}")
        logger.info(f"   RESEND_API_KEY: {'***' + self.resend_api_key[-10:] if self.resend_api_key else 'NOT SET'}")
        logger.info(f"   SENDER_EMAIL: {self.sender_email}")
        logger.info(f"   APP_URL: {self.app_url}")
        
        if self.use_resend and not self.resend_api_key:
            logger.error("RESEND_API_KEY not set in .env")
        
    def send_password_reset_email(self, recipient_email: str, reset_token: str, username: str = None) -> bool:
        """
        Send a password reset email to the user with a secure link.
        
        Args:
            recipient_email: User's email address
            reset_token: Secure token for password reset
            username: Optional username for personalization
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if self.use_resend:
            return self._send_with_resend(recipient_email, reset_token, username)
        else:
            return self._log_email_to_file(recipient_email, reset_token, username)
    
    def _send_with_resend(self, recipient_email: str, reset_token: str, username: str = None) -> bool:
        """Send email using Resend API via HTTP"""
        try:
            if not self.resend_api_key:
                logger.error("Resend API key not configured")
                return False
            
            reset_link = f"{self.app_url}/reset-password?token={reset_token}"
            
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff6b35;">SmartChef</h1>
                  </div>
                  
                  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #333; margin-top: 0;">Hello {username or 'User'},</h2>
                    
                    <p>You requested a password reset for your SmartChef account.</p>
                    
                    <p style="margin: 30px 0;">
                      <a href="{reset_link}" 
                         style="display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Your Password
                      </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                      This link will expire in 1 hour.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                      If you didn't request this password reset, please ignore this email or contact support.
                      <br><br>
                      <strong>Don't share this link with anyone.</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                    <p>Copyright 2026 SmartChef. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
            """
            
            # Make HTTP request to Resend API
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": self.sender_email,
                "to": recipient_email,
                "subject": "SmartChef - Reset Your Password",
                "html": html_content
            }
            
            response = requests.post(
                "https://api.resend.com/emails",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                email_id = result.get("id")
                logger.info(f"Password reset email sent to {recipient_email} (ID: {email_id})")
                return True
            else:
                error_msg = response.text
                logger.error(f"Failed to send email: {response.status_code} - {error_msg}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending email: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error sending email with Resend: {str(e)}")
            return False
        
    def _log_email_to_file(self, recipient_email: str, reset_token: str, username: str = None) -> bool:
        """
        Log email details to a file for testing (when service is not configured)
        """
        try:
            reset_link = f"{self.app_url}/reset-password?token={reset_token}"
            
            # Create emails directory if it doesn't exist
            os.makedirs("emails", exist_ok=True)
            
            # Create email log file
            email_file = f"emails/password_reset_{recipient_email.replace('@', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            email_content = f"""
PASSWORD RESET EMAIL - {datetime.now()}
=====================================

To: {recipient_email}
Subject: SmartChef - Reset Your Password

RESET LINK (valid for 1 hour):
{reset_link}

TOKEN: {reset_token}

---

TESTING INSTRUCTIONS:
1. Copy the RESET LINK above
2. Paste it in your browser address bar
3. Or manually navigate to: {self.app_url}/reset-password?token={reset_token}
4. Enter your new password
5. You can now login with the new password

=====================================
"""
            
            with open(email_file, "w", encoding="utf-8") as f:
                f.write(email_content)
            
            logger.info(f"Password reset email logged to: {email_file}")
            logger.info(f"Reset link: {reset_link}")
            return True
            
        except Exception as e:
            logger.error(f"Error logging email: {str(e)}")
            return False

    def send_analysis_complete_email(self, recipient_email: str, food_name: str, ingredients: list, ingredients_count: int) -> bool:
        """
        Send an email notification when image analysis is complete.
        
        Args:
            recipient_email: User's email address
            food_name: Detected food name
            ingredients: List of detected ingredients
            ingredients_count: Number of ingredients detected
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if self.use_resend:
            return self._send_analysis_email_with_resend(recipient_email, food_name, ingredients, ingredients_count)
        else:
            return self._log_analysis_email_to_file(recipient_email, food_name, ingredients, ingredients_count)
    
    def _send_analysis_email_with_resend(self, recipient_email: str, food_name: str, ingredients: list, ingredients_count: int) -> bool:
        """Send analysis complete email using Resend API"""
        try:
            if not self.resend_api_key:
                logger.error("Resend API key not configured")
                return False
            
            ingredients_html = "".join([
                f'<li style="padding: 5px 0;">{ingredient}</li>'
                for ingredient in ingredients
            ])
            
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff6b35;">SmartChef ✅</h1>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0;">Your Analysis is Ready!</h2>
                    <p style="margin: 0; font-size: 16px;">🍽️ {food_name}</p>
                  </div>
                  
                  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                    <h3 style="color: #333; margin-top: 0;">Detected Ingredients ({ingredients_count})</h3>
                    <ul style="list-style-type: none; padding: 0; margin: 0;">
                      {ingredients_html}
                    </ul>
                    
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="{self.app_url}/notifications" 
                         style="display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px;">
                        View Details
                      </a>
                      <a href="{self.app_url}" 
                         style="display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px;">
                        Go to App
                      </a>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                    <p>Copyright 2026 SmartChef. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
            """
            
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": self.sender_email,
                "to": recipient_email,
                "subject": f"SmartChef - Analysis Complete: {food_name}",
                "html": html_content
            }
            
            response = requests.post(
                "https://api.resend.com/emails",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                email_id = result.get("id")
                logger.info(f"Analysis email sent to {recipient_email} (ID: {email_id})")
                return True
            else:
                error_msg = response.text
                logger.error(f"Failed to send analysis email: {response.status_code} - {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending analysis email with Resend: {str(e)}")
            return False
    
    def _log_analysis_email_to_file(self, recipient_email: str, food_name: str, ingredients: list, ingredients_count: int) -> bool:
        """Log analysis email to file for testing"""
        try:
            os.makedirs("emails", exist_ok=True)
            
            email_file = f"emails/analysis_{recipient_email.replace('@', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            ingredients_text = "\n  - ".join(ingredients)
            
            email_content = f"""
ANALYSIS COMPLETE EMAIL - {datetime.now()}
=====================================

To: {recipient_email}
From: {self.sender_email}
Subject: SmartChef - Analysis Complete: {food_name}

Food Name: {food_name}
Ingredients Detected: {ingredients_count}

Ingredients:
  - {ingredients_text}

View Details: {self.app_url}/notifications
Go to App: {self.app_url}
"""
            
            with open(email_file, "w", encoding="utf-8") as f:
                f.write(email_content)
            
            logger.info(f"Analysis email logged to: {email_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error logging analysis email: {str(e)}")
            return False


# Create a singleton instance
email_service = EmailService()
