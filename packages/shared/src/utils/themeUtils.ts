/**
 * Theme utility functions for consistent theme handling across components
 */

/**
 * Get system theme preference with SSR safety
 * @returns 'dark' | 'light' based on system preference, defaults to 'light' for SSR
 */
export const getSystemTheme = (): 'dark' | 'light' => {
  // SSR safety check
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Fallback for SSR
};