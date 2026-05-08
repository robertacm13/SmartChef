import React, { useState } from 'react';
import './Tooltip.css';

/**
 * Tooltip component pentru Nielsen Heuristic #6: Recognition vs Recall
 * Oferă context și informații fără ca utilizatorul să le memoreze
 */
export default function Tooltip({ text, position = 'top', children, delay = 300 }) {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setVisible(false);
  };

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {children}
      {visible && (
        <div 
          className={`tooltip-bubble tooltip-${position}`}
          role="tooltip"
          aria-live="polite"
        >
          {text}
          <div className={`tooltip-arrow tooltip-arrow-${position}`} />
        </div>
      )}
    </div>
  );
}

/**
 * InfoIcon component - iconița de info cu tooltip
 */
export function InfoIcon({ text, size = '16px' }) {
  return (
    <Tooltip text={text} position="top">
      <span 
        className="info-icon"
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--bg)',
          color: 'var(--primary, #3B82F6)',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'help',
          marginLeft: '6px',
          border: '1px solid var(--accent, rgba(59, 130, 246, 0.5))'
        }}
        aria-label="Informații suplimentare"
        tabIndex="0"
      >
        ?
      </span>
    </Tooltip>
  );
}

