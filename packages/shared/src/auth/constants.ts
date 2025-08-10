/**
 * Foreman-specific session cookie names that need to be cleared during logout
 * to prevent authentication bypass via session cookies
 */
export const FOREMAN_SESSION_COOKIES = [
  '_foreman_session',
  'foreman_session',
  'session_id'
] as const;

/**
 * Utility function to clear Foreman-specific session cookies
 * This prevents authentication bypass via session cookies while avoiding
 * affecting other applications running on the same domain
 */
export const clearForemanSessionCookies = (): void => {
  FOREMAN_SESSION_COOKIES.forEach((cookieName) => {
    document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/';
    document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/;domain=' + window.location.hostname;
  });
};