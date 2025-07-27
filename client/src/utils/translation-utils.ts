import { SUPPORTED_LANGUAGES } from '@/components/ui/language-selector';

export interface TranslationData {
  [languageCode: string]: string;
}

/**
 * Get the translated label for a form element
 * @param element - The form element with translations
 * @param languageCode - The language code to get translation for (defaults to 'en')
 * @returns The translated label or the original label if no translation exists
 */
export function getTranslatedLabel(
  element: { label: string; labelTranslations?: Record<string, string> },
  languageCode: string = 'en'
): string {
  if (languageCode === 'en') {
    return element.label;
  }
  
  return element.labelTranslations?.[languageCode] || element.label;
}

/**
 * Get all available translations for a form element
 * @param element - The form element with translations
 * @returns Object with language codes as keys and translated labels as values
 */
export function getAllTranslations(
  element: { label: string; labelTranslations?: Record<string, string> }
): Record<string, string> {
  const translations: Record<string, string> = {
    en: element.label, // Always include English as the base
  };
  
  if (element.labelTranslations) {
    Object.assign(translations, element.labelTranslations);
  }
  
  return translations;
}

/**
 * Check if a form element has translations
 * @param element - The form element to check
 * @returns True if the element has translations, false otherwise
 */
export function hasTranslations(
  element: { labelTranslations?: Record<string, string> }
): boolean {
  return !!(element.labelTranslations && Object.keys(element.labelTranslations).length > 0);
}

/**
 * Get the count of translations for a form element
 * @param element - The form element to check
 * @returns The number of translations (excluding English)
 */
export function getTranslationCount(
  element: { labelTranslations?: Record<string, string> }
): number {
  return element.labelTranslations ? Object.keys(element.labelTranslations).length : 0;
}

/**
 * Get language information by code
 * @param languageCode - The language code to look up
 * @returns Language information or undefined if not found
 */
export function getLanguageInfo(languageCode: string) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
}

/**
 * Get all supported languages
 * @returns Array of all supported languages
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Validate if a language code is supported
 * @param languageCode - The language code to validate
 * @returns True if the language is supported, false otherwise
 */
export function isSupportedLanguage(languageCode: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
}

/**
 * Get the display name for a language code
 * @param languageCode - The language code
 * @returns The display name or the language code if not found
 */
export function getLanguageDisplayName(languageCode: string): string {
  const language = getLanguageInfo(languageCode);
  return language ? language.name : languageCode;
}

/**
 * Get the flag emoji for a language code
 * @param languageCode - The language code
 * @returns The flag emoji or empty string if not found
 */
export function getLanguageFlag(languageCode: string): string {
  const language = getLanguageInfo(languageCode);
  return language ? language.flag : '';
} 