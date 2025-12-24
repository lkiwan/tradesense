import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling keyboard hotkeys
 * @param {Object} keyMap - Object mapping keys to callback functions
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether hotkeys are enabled
 * @param {boolean} options.preventDefault - Whether to prevent default action
 * @param {string[]} options.ignoreInputs - Tag names to ignore (default: ['INPUT', 'TEXTAREA', 'SELECT'])
 */
const useHotkeys = (keyMap, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = ['INPUT', 'TEXTAREA', 'SELECT']
  } = options;

  const keyMapRef = useRef(keyMap);

  // Update ref when keyMap changes
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Ignore if focus is on input elements
    const activeElement = document.activeElement;
    if (activeElement && ignoreInputs.includes(activeElement.tagName)) {
      return;
    }

    // Build key identifier
    const key = event.key.toUpperCase();
    const modifiers = [];

    if (event.ctrlKey) modifiers.push('CTRL');
    if (event.altKey) modifiers.push('ALT');
    if (event.shiftKey) modifiers.push('SHIFT');
    if (event.metaKey) modifiers.push('META');

    // Check for modifier + key combinations
    const keyWithModifiers = modifiers.length > 0
      ? `${modifiers.join('+')}+${key}`
      : key;

    // Find matching handler
    const handler = keyMapRef.current[key] || keyMapRef.current[keyWithModifiers];

    if (handler) {
      if (preventDefault) {
        event.preventDefault();
      }
      handler(event);
    }
  }, [enabled, preventDefault, ignoreInputs]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Hook for trading-specific hotkeys with visual feedback
 */
export const useTradingHotkeys = ({
  onBuy,
  onSell,
  onCloseAll,
  onCancelOrders,
  enabled = true,
  hotkeys = { buy: 'B', sell: 'S', closeAll: 'X', cancelOrders: 'C' }
}) => {
  const lastKeyRef = useRef(null);
  const lastKeyTimeRef = useRef(0);

  const keyMap = {
    [hotkeys.buy.toUpperCase()]: () => {
      if (onBuy) onBuy();
      lastKeyRef.current = 'BUY';
      lastKeyTimeRef.current = Date.now();
    },
    [hotkeys.sell.toUpperCase()]: () => {
      if (onSell) onSell();
      lastKeyRef.current = 'SELL';
      lastKeyTimeRef.current = Date.now();
    },
    [hotkeys.closeAll.toUpperCase()]: () => {
      if (onCloseAll) onCloseAll();
      lastKeyRef.current = 'CLOSE_ALL';
      lastKeyTimeRef.current = Date.now();
    },
    [hotkeys.cancelOrders.toUpperCase()]: () => {
      if (onCancelOrders) onCancelOrders();
      lastKeyRef.current = 'CANCEL';
      lastKeyTimeRef.current = Date.now();
    }
  };

  useHotkeys(keyMap, { enabled });

  return {
    lastKey: lastKeyRef.current,
    lastKeyTime: lastKeyTimeRef.current
  };
};

/**
 * Hook for detecting double-press of a key (e.g., double-tap X to close all)
 */
export const useDoubleTap = (key, callback, delay = 300, enabled = true) => {
  const lastPressRef = useRef(0);

  const keyMap = {
    [key.toUpperCase()]: () => {
      const now = Date.now();
      if (now - lastPressRef.current < delay) {
        callback();
        lastPressRef.current = 0; // Reset after successful double-tap
      } else {
        lastPressRef.current = now;
      }
    }
  };

  useHotkeys(keyMap, { enabled });
};

export default useHotkeys;
