import i18next from 'i18next';
import { PluginI18nConfig } from './types';

/**
 * Service for managing plugin translations with Foreman gettext integration
 */
export class PluginTranslationService {
  private i18nInstance: typeof i18next;

  constructor(i18nInstance?: typeof i18next) {
    this.i18nInstance = i18nInstance || i18next;
  }

  /**
   * Set the i18next instance for this translation service
   */
  setI18nInstance(i18nInstance: typeof i18next): void {
    this.i18nInstance = i18nInstance;
  }
  /**
   * Load translations for a plugin
   */
  async loadPluginTranslations(pluginName: string, i18nConfig: PluginI18nConfig): Promise<void> {
    const domain = i18nConfig.domain || pluginName;

    try {
      // Prepare fallback translations from plugin configuration
      const fallbackTranslations = this.prepareFallbackTranslations(i18nConfig);

      // Attempt to load from Foreman's translation system if available
      const remoteTranslations = await this.loadRemoteTranslations(i18nConfig);

      // Merge remote and fallback translations (remote takes precedence)
      const finalTranslations = { ...fallbackTranslations, ...remoteTranslations };

      // Register with i18next using domain as namespace
      this.registerTranslations(i18nConfig.defaultLocale, domain, finalTranslations);

      console.log(`Loaded translations for plugin ${pluginName} (domain: ${domain})`);
    } catch (error) {
      console.error(`Failed to load translations for plugin ${pluginName}:`, error);

      // Fallback to development keys only
      await this.loadFallbackOnly(pluginName, i18nConfig);
    }
  }

  /**
   * Remove translations for a plugin
   */
  removePluginTranslations(pluginName: string, i18nConfig?: PluginI18nConfig): void {
    if (!i18nConfig) return;

    const domain = i18nConfig.domain || pluginName;
    i18next.removeResourceBundle(i18next.language, domain);
  }

  /**
   * Get translation namespace for a plugin
   */
  getPluginTranslationNamespace(pluginName: string, i18nConfig?: PluginI18nConfig): string {
    return i18nConfig?.domain || pluginName;
  }

  /**
   * Prepare fallback translations from plugin configuration
   */
  private prepareFallbackTranslations(i18nConfig: PluginI18nConfig): Record<string, unknown> {
    const translations: Record<string, unknown> = {};
    Object.entries(i18nConfig.keys).forEach(([key, defaultValue]) => {
      translations[key] = defaultValue;
    });
    return translations;
  }

  /**
   * Load translations from Foreman's remote translation system
   */
  private async loadRemoteTranslations(i18nConfig: PluginI18nConfig): Promise<Record<string, unknown>> {
    if (!i18nConfig.translationUrl) {
      return {};
    }

    // TODO: Implement actual remote translation loading
    // This would typically fetch from Foreman's /api/translations endpoint
    // For now, return empty object to use fallback translations
    return {};
  }

  /**
   * Register translations with i18next
   */
  private registerTranslations(
    locale: string,
    namespace: string,
    translations: Record<string, unknown>
  ): void {
    // Check if i18next is initialized and has addResourceBundle method
    if (this.i18nInstance && typeof this.i18nInstance.addResourceBundle === 'function') {
      this.i18nInstance.addResourceBundle(locale, namespace, translations, true, true);
    } else {
      console.warn(
        `Cannot register translations for ${namespace}: i18next is not properly initialized. ` +
        `Ensure that i18next is initialized before loading translations. ` +
        `If you are using a custom i18next instance, call configureTranslationService(i18nInstance) to set it.`
      );
    }
  }

  /**
   * Load only fallback translations when everything else fails
   */
  private async loadFallbackOnly(pluginName: string, i18nConfig: PluginI18nConfig): Promise<void> {
    const domain = i18nConfig.domain || pluginName;
    const fallbackTranslations = this.prepareFallbackTranslations(i18nConfig);

    try {
      this.registerTranslations(i18nConfig.defaultLocale, domain, fallbackTranslations);
      console.log(`Loaded fallback translations for plugin ${pluginName}`);
    } catch (fallbackError) {
      console.error(`Failed to load even fallback translations for plugin ${pluginName}:`, fallbackError);
      // Continue anyway - translations are optional for plugin functionality
    }
  }
}

// Export singleton instance (will be configured with proper i18next instance)
export const pluginTranslationService = new PluginTranslationService();

// Export function to configure the translation service with proper i18next instance
export const configureTranslationService = (i18nInstance: typeof i18next) => {
  // Update the singleton to use the provided instance in a type-safe way
  pluginTranslationService.setI18nInstance(i18nInstance);
};