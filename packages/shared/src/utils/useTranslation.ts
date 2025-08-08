import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

/**
 * Re-export react-i18next's useTranslation hook for consistency
 * The app should handle i18next initialization before rendering components
 */
export const useTranslation = useReactI18nextTranslation;