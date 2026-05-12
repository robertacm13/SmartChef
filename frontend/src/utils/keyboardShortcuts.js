import { useEffect } from 'react';

/**
 * Keyboard Shortcuts - Nielsen Heuristic #7: Flexibility and Efficiency of Use
 * Permite utilizatorilor avansați să navigheze rapid
 */

export const SHORTCUTS = {
  // Navigation
  'h': { description: 'Go to Home', action: 'navigate-home' },
  'a': { description: 'Analizează alimentul', action: 'navigate-analyze' },
  's': { description: 'Istoric (History)', action: 'navigate-history' },
  'd': { description: 'Dashboard', action: 'navigate-dashboard' },
  
  // Actions
  'u': { description: 'Upload imagine', action: 'upload-image' },
  'Enter': { description: 'Analizează/Confirmă', action: 'submit' },
  'Escape': { description: 'Close modal / Cancel', action: 'cancel' },
  
  // UI
  't': { description: 'Toggle Dark Mode', action: 'toggle-theme' },
  'f': { description: 'Focus căutare', action: 'focus-search' },
  '?': { description: 'Arată shortcuts', action: 'show-help' },
  
  // With modifiers
  'Ctrl+k': { description: 'Caută', action: 'quick-search' },
  'Ctrl+s': { description: 'Salvează', action: 'save' },
  'Ctrl+/': { description: 'Shortcuts', action: 'show-shortcuts' }
};

/**
 * Hook pentru keyboard shortcuts globale
 */
export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignoră shortcuts când utilizatorul scrie în input/textarea
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        // Permitem doar shortcuts cu Ctrl/Cmd și Escape
        if (!e.ctrlKey && !e.metaKey && e.key !== 'Escape') {
          return;
        }
      }

      // Construiește key combination
      let combo = '';
      if (e.ctrlKey || e.metaKey) combo += 'Ctrl+';
      if (e.altKey) combo += 'Alt+';
      if (e.shiftKey && e.key.length > 1) combo += 'Shift+';
      combo += e.key;

      // Caută handler pentru acest shortcut
      const handler = handlers[combo] || handlers[e.key];
      
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

/**
 * Componenta pentru afișarea shortcuts disponibile
 */
export function ShortcutsHelp({ onClose, customShortcuts = {} }) {
  const allShortcuts = { ...SHORTCUTS, ...customShortcuts };
  
  useEffect(() => {
    // Închide cu Escape
    function handleEscape(e) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  return (
    <div 
      className="shortcuts-overlay"
      onClick={onClose}
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      <div 
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h2 id="shortcuts-title">⌨️ Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="shortcuts-close"
            aria-label="Închide"
          >
            ✕
          </button>
        </div>
        
        <div className="shortcuts-content">
          <div className="shortcuts-section">
            <h3>🧭 Navigare</h3>
            <div className="shortcuts-list">
              {Object.entries(allShortcuts)
                .filter(([_, info]) => info && info.action && info.action.startsWith('navigate'))
                .map(([key, info]) => (
                  <div key={key} className="shortcut-item">
                    <kbd className="shortcut-key">{key}</kbd>
                    <span className="shortcut-desc">{info.description}</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="shortcuts-section">
            <h3>⚡ Acțiuni</h3>
            <div className="shortcuts-list">
              {Object.entries(allShortcuts)
                .filter(([_, info]) => 
                  info && info.action &&
                  !info.action.startsWith('navigate') && 
                  !info.action.includes('theme') &&
                  !info.action.includes('help')
                )
                .map(([key, info]) => (
                  <div key={key} className="shortcut-item">
                    <kbd className="shortcut-key">{key}</kbd>
                    <span className="shortcut-desc">{info.description}</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="shortcuts-section">
            <h3>🎨 Interfață</h3>
            <div className="shortcuts-list">
              {Object.entries(allShortcuts)
                .filter(([_, info]) => 
                  info && info.action &&
                  (info.action.includes('theme') || info.action.includes('help'))
                )
                .map(([key, info]) => (
                  <div key={key} className="shortcut-item">
                    <kbd className="shortcut-key">{key}</kbd>
                    <span className="shortcut-desc">{info.description}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="shortcuts-footer">
          <p>💡 Apasă <kbd>?</kbd> pentru a vedea acest help oricând</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge pentru afișarea shortcut-ului lângă butoane
 */
export function ShortcutBadge({ shortcut }) {
  return (
    <span className="shortcut-badge" aria-label={`Shortcut: ${shortcut}`}>
      {shortcut}
    </span>
  );
}

