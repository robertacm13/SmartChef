import React from 'react';

/**
 * User-friendly error messages - Nielsen Heuristic #9
 * Transform technical errors into clear, actionable messages
 */

export const ERROR_MESSAGES = {
  // Network & Server Errors
  'NetworkError': {
    title: "Connection problem 📡",
    message: "We cannot connect to the server. Check your internet connection and try again.",
    action: "Retry",
    severity: "error",
    icon: "📡"
  },
  'Failed to fetch': {
    title: "Server unavailable 🔌",
    message: "Backend is not responding. Make sure the server is running on http://localhost:8000",
    action: "Check server",
    severity: "error",
    icon: "🔌"
  },
  'timeout': {
    title: "Processing too long ⏱️",
    message: "The request took too long. The server may be overloaded. Try again.",
    action: "Retry",
    severity: "warning",
    icon: "⏱️"
  },

  // Authentication Errors
  'Invalid 2FA code': {
    title: "Incorrect 2FA code 🔐",
    message: "The code from Google Authenticator is not correct. Check that you entered all 6 digits and it hasn't expired.",
    action: "Try again",
    severity: "warning",
    icon: "🔐",
    tips: [
      "Wait a few seconds for a new code",
      "Check that your phone time is correct",
      "The code changes every 30 seconds"
    ]
  },
  'User not found': {
    title: "Account does not exist ❌",
    message: "There is no account with this email address.",
    action: "Sign up",
    severity: "info",
    icon: "❌",
    tips: ["Check if you spelled the email correctly", "Want to create a new account?"]
  },
  'Wrong password': {
    title: "Incorrect password 🔒",
    message: "The password entered is not correct for this account.",
    action: "Try again",
    severity: "warning",
    icon: "🔒",
    tips: [
      "Check Caps Lock",
      "Password is case-sensitive (A ≠ a)"
    ]
  },
  'Email already exists': {
    title: "Email already registered 📧",
    message: "This email already has an account. Do you want to sign in?",
    action: "Sign in",
    severity: "info",
    icon: "📧"
  },

  // File Upload Errors
  'File too large': {
    title: "File too large 📁",
    message: "The uploaded image exceeds the 10MB limit. Compress it or choose another image.",
    action: "Choose another file",
    severity: "warning",
    icon: "📁",
    tips: [
      "Try compressing the image with TinyPNG",
      "Resize the image to a lower resolution"
    ]
  },
  'Invalid file type': {
    title: "Invalid file type 🖼️",
    message: "You can only upload images (JPG, PNG, WEBP, HEIC).",
    action: "Choose an image",
    severity: "warning",
    icon: "🖼️"
  },
  'No file selected': {
    title: "No file selected 📷",
    message: "Please select a food image for analysis.",
    action: "Select image",
    severity: "info",
    icon: "📷"
  },

  // API Errors
  'Error processing image': {
    title: "Processing error 🔧",
    message: "Could not analyze the image. It may be too dark or blurry.",
    action: "Try another image",
    severity: "error",
    icon: "🔧",
    tips: [
      "Take the photo in good lighting",
      "Make sure the food is visible",
      "Avoid objects in the background"
    ]
  },
  'Rate limit exceeded': {
    title: "Too many attempts ⚠️",
    message: "You have made too many requests. Please wait a few minutes.",
    action: "Wait",
    severity: "warning",
    icon: "⚠️"
  },

  // Validation Errors
  'Invalid email format': {
    title: "Invalid email 📮",
    message: "The email address is not in the correct format (example: name@domain.com).",
    action: "Correct the email",
    severity: "warning",
    icon: "📮"
  },
  'Password too weak': {
    title: "Password too weak 🔓",
    message: "Password must have at least 8 characters, one uppercase letter, one digit, and one special character.",
    action: "Choose a stronger password",
    severity: "warning",
    icon: "🔓",
    tips: [
      "Example of good password: MyPass123!",
      "Avoid common passwords like '12345678'",
      "Use a combination of letters, digits, and symbols"
    ]
  }
};

/**
 * Transform a technical error into a user-friendly message
 */
export function getUserFriendlyError(error, fallback = null) {
  // Try to find the message in the error object
  let errorKey = null;
  
  if (typeof error === 'string') {
    errorKey = error;
  } else if (error?.message) {
    errorKey = error.message;
  } else if (error?.detail) {
    errorKey = error.detail;
  } else if (error?.error) {
    errorKey = error.error;
  }

  // Search in the errors dictionary
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorKey && errorKey.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback for unknown errors
  return fallback || {
    title: "An error occurred ⚠️",
    message: errorKey || "Something went wrong. Please try again.",
    action: "OK",
    severity: "error",
    icon: "⚠️"
  };
}

/**
 * ErrorDisplay component for user-friendly display
 */
export function ErrorDisplay({ error, onAction, onDismiss }) {
  const errorInfo = getUserFriendlyError(error);
  
  return (
    <div className={`error-display error-${errorInfo.severity}`} role="alert" aria-live="assertive">
      <div className="error-icon">{errorInfo.icon}</div>
      
      <div className="error-content">
        <h3 className="error-title">{errorInfo.title}</h3>
        <p className="error-message">{errorInfo.message}</p>
        
        {errorInfo.tips && errorInfo.tips.length > 0 && (
          <ul className="error-tips">
            {errorInfo.tips.map((tip, index) => (
              <li key={index}>💡 {tip}</li>
            ))}
          </ul>
        )}
        
        <div className="error-actions">
          {onAction && (
            <button 
              className="error-action-btn primary"
              onClick={onAction}
            >
              {errorInfo.action}
            </button>
          )}
          {onDismiss && (
            <button 
              className="error-action-btn secondary"
              onClick={onDismiss}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for error handling
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);
  
  const handleError = (err) => {
    const friendlyError = getUserFriendlyError(err);
    setError(friendlyError);
    
    // Auto-dismiss after 10 seconds for info/warning
    if (friendlyError.severity !== 'error') {
      setTimeout(() => setError(null), 10000);
    }
  };
  
  const clearError = () => setError(null);
  
  return { error, handleError, clearError };
}
