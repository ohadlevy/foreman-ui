import { useState, useEffect } from 'react';

/**
 * Safely checks if the document currently has focus
 * Handles SSR and environment compatibility
 */
const getInitialFocusState = (): boolean => {
  try {
    if (typeof document === 'undefined') {
      return false;
    }
    
    if (typeof document.hasFocus !== 'function') {
      return false;
    }
    
    return document.hasFocus();
  } catch {
    return false;
  }
};

/**
 * Hook to track window focus state
 * Returns true when the window is focused, false when not focused
 * 
 * Uses document.hasFocus() for initial state (synchronous check) and 
 * window focus/blur events for ongoing tracking (standard event pattern)
 */
export const useWindowFocus = (): boolean => {
  const [isWindowFocused, setIsWindowFocused] = useState(() => getInitialFocusState());

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  return isWindowFocused;
};