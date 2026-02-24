import React from 'react';

/**
 * User-friendly error messages - Nielsen Heuristic #9
 * Transformă erori tehnice în mesaje clare, acționabile
 */

export const ERROR_MESSAGES = {
  // Network & Server Errors
  'NetworkError': {
    title: "Problemă de conexiune 📡",
    message: "Nu ne putem conecta la server. Verifică conexiunea la internet și încearcă din nou.",
    action: "Reîncearcă",
    severity: "error",
    icon: "📡"
  },
  'Failed to fetch': {
    title: "Server indisponibil 🔌",
    message: "Backend-ul nu răspunde. Asigură-te că serverul rulează pe http://localhost:8001",
    action: "Verifică serverul",
    severity: "error",
    icon: "🔌"
  },
  'timeout': {
    title: "Procesare prea lungă ⏱️",
    message: "Cererea a durat prea mult. Serverul poate fi suprasolicitat. Încearcă din nou.",
    action: "Reîncearcă",
    severity: "warning",
    icon: "⏱️"
  },

  // Authentication Errors
  'Invalid 2FA code': {
    title: "Cod 2FA incorrect 🔐",
    message: "Codul din Google Authenticator nu este corect. Verifică că ai introdus cele 6 cifre și că nu a expirat.",
    action: "Încearcă din nou",
    severity: "warning",
    icon: "🔐",
    tips: [
      "Așteaptă câteva secunde pentru un cod nou",
      "Verifică că ora pe telefon este corectă",
      "Codul se schimbă la fiecare 30 de secunde"
    ]
  },
  'User not found': {
    title: "Cont inexistent ❌",
    message: "Nu există un cont cu această adresă de email.",
    action: "Înregistrare",
    severity: "info",
    icon: "❌",
    tips: ["Verifică dacă ai scris corect email-ul", "Dorești să creezi un cont nou?"]
  },
  'Wrong password': {
    title: "Parolă incorectă 🔒",
    message: "Parola introdusă nu este corectă pentru acest cont.",
    action: "Încearcă din nou",
    severity: "warning",
    icon: "🔒",
    tips: [
      "Verifică Caps Lock",
      "Parola este case-sensitive (A ≠ a)"
    ]
  },
  'Email already exists': {
    title: "Email deja înregistrat 📧",
    message: "Acest email are deja un cont. Vrei să te autentifici?",
    action: "Autentifică-te",
    severity: "info",
    icon: "📧"
  },

  // File Upload Errors
  'File too large': {
    title: "Fișier prea mare 📁",
    message: "Imaginea încărcată depășește limita de 10MB. Compresia ei sau alege o altă imagine.",
    action: "Alege alt fișier",
    severity: "warning",
    icon: "📁",
    tips: [
      "Încearcă să comprimi imaginea cu TinyPNG",
      "Redimensionează imaginea la rezoluție mai mică"
    ]
  },
  'Invalid file type': {
    title: "Tip fișier invalid 🖼️",
    message: "Poți încărca doar imagini (JPG, PNG, WEBP, HEIC).",
    action: "Alege o imagine",
    severity: "warning",
    icon: "🖼️"
  },
  'No file selected': {
    title: "Niciun fișier selectat 📷",
    message: "Te rugăm să selectezi o imagine cu mâncare pentru analiză.",
    action: "Selectează imagine",
    severity: "info",
    icon: "📷"
  },

  // API Errors
  'Error processing image': {
    title: "Eroare la procesare 🔧",
    message: "Nu am putut analiza imaginea. Poate fi prea întunecată sau neclară.",
    action: "Încearcă altă imagine",
    severity: "error",
    icon: "🔧",
    tips: [
      "Fă poza în lumină bună",
      "Asigură-te că mâncarea este vizibilă",
      "Evită obiectele din fundal"
    ]
  },
  'Rate limit exceeded': {
    title: "Prea multe încercări ⚠️",
    message: "Ai efectuat prea multe cereri. Te rugăm să aștepți câteva minute.",
    action: "Așteaptă",
    severity: "warning",
    icon: "⚠️"
  },

  // Validation Errors
  'Invalid email format': {
    title: "Email invalid 📮",
    message: "Adresa de email nu este în format corect (exemplu: nume@domeniu.ro).",
    action: "Corectează email-ul",
    severity: "warning",
    icon: "📮"
  },
  'Password too weak': {
    title: "Parolă prea slabă 🔓",
    message: "Parola trebuie să aibă minim 8 caractere, o literă mare, o cifră și un caracter special.",
    action: "Alege o parolă mai sigură",
    severity: "warning",
    icon: "🔓",
    tips: [
      "Exemplu parolă bună: MyPass123!",
      "Evită parole comune precum '12345678'",
      "Folosește o combinație de litere, cifre și simboluri"
    ]
  }
};

/**
 * Transformă o eroare tehnică într-un mesaj user-friendly
 */
export function getUserFriendlyError(error, fallback = null) {
  // Încearcă să găsească mesajul în obiectul error
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

  // Caută în dicționarul de erori
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorKey && errorKey.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback pentru erori necunoscute
  return fallback || {
    title: "A apărut o eroare ⚠️",
    message: errorKey || "Ceva nu a funcționat corect. Te rugăm să încerci din nou.",
    action: "OK",
    severity: "error",
    icon: "⚠️"
  };
}

/**
 * Componenta ErrorDisplay pentru afișare user-friendly
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
              Închide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pentru gestionarea erorilor
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);
  
  const handleError = (err) => {
    const friendlyError = getUserFriendlyError(err);
    setError(friendlyError);
    
    // Auto-dismiss după 10 secunde pentru info/warning
    if (friendlyError.severity !== 'error') {
      setTimeout(() => setError(null), 10000);
    }
  };
  
  const clearError = () => setError(null);
  
  return { error, handleError, clearError };
}
