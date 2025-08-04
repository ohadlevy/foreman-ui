import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Initialize i18next for the user portal application
 * This sets up the basic configuration - actual translations are loaded separately
 */
const initI18n = async () => {
  if (!i18next.isInitialized) {
    await i18next
      .use(initReactI18next)
      .init({
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        resources: {
          en: {
            translation: {} // Empty - translations loaded separately
          }
        },
        // Plugin translations will be added dynamically by the plugin system
        saveMissing: false,
        debug: process.env.NODE_ENV === 'development',
      });
  }
  return i18next;
};

export default initI18n;
export { i18next };