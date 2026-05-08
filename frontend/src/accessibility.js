/**
 * Accessibility Utilities for SmartChef
 * WCAG 2.1 Level AA Compliance
 */

/**
 * Focus trap for modals
 * Ensures keyboard focus stays within modal
 */
export function setupFocusTrap(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  function handleTab(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
  
  modalElement.addEventListener('keydown', handleTab);
  
  // Focus first element
  firstFocusable?.focus();
  
  // Return cleanup function
  return () => {
    modalElement.removeEventListener('keydown', handleTab);
  };
}

/**
 * Announce to screen readers
 * Uses aria-live region
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check color contrast ratio
 * WCAG requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground, background) {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Keyboard navigation handler
 * Enables arrow key navigation in lists
 */
export function enableKeyboardNavigation(containerElement) {
  const items = Array.from(containerElement.querySelectorAll('[role="listitem"], button, a'));
  let currentIndex = 0;
  
  function handleKeyDown(e) {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items[currentIndex].focus();
        break;
      case 'Home':
        e.preventDefault();
        currentIndex = 0;
        items[currentIndex].focus();
        break;
      case 'End':
        e.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex].focus();
        break;
    }
  }
  
  containerElement.addEventListener('keydown', handleKeyDown);
  
  // Set tabindex
  items.forEach((item, index) => {
    item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    item.addEventListener('focus', () => { currentIndex = index; });
  });
  
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Skip navigation link
 * Allows keyboard users to skip to main content
 */
export function createSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Sari la conținutul principal';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 9999;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Generate unique ID for aria-labelledby relationships
 */
let idCounter = 0;
export function generateUniqueId(prefix = 'id') {
  return `${prefix}-${++idCounter}`;
}

