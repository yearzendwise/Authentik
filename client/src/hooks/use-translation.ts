import { useState, useCallback } from 'react';
import { getTranslatedLabel, hasTranslations, getTranslationCount, getAllTranslations } from '@/utils/translation-utils';

export interface TranslationHookProps {
  currentLanguage?: string;
  defaultLanguage?: string;
}

export function useTranslation(props: TranslationHookProps = {}) {
  const { currentLanguage = 'en', defaultLanguage = 'en' } = props;
  const [activeLanguage, setActiveLanguage] = useState(currentLanguage);

  /**
   * Get the translated label for a form element
   */
  const getLabel = useCallback((
    element: { label: string; labelTranslations?: Record<string, string> },
    languageCode?: string
  ): string => {
    const targetLanguage = languageCode || activeLanguage;
    return getTranslatedLabel(element, targetLanguage);
  }, [activeLanguage]);

  /**
   * Check if an element has translations
   */
  const hasElementTranslations = useCallback((
    element: { labelTranslations?: Record<string, string> }
  ): boolean => {
    return hasTranslations(element);
  }, []);

  /**
   * Get translation count for an element
   */
  const getElementTranslationCount = useCallback((
    element: { labelTranslations?: Record<string, string> }
  ): number => {
    return getTranslationCount(element);
  }, []);

  /**
   * Get all translations for an element
   */
  const getElementTranslations = useCallback((
    element: { label: string; labelTranslations?: Record<string, string> }
  ): Record<string, string> => {
    return getAllTranslations(element);
  }, []);

  /**
   * Switch the active language
   */
  const switchLanguage = useCallback((languageCode: string) => {
    setActiveLanguage(languageCode);
  }, []);

  /**
   * Reset to default language
   */
  const resetLanguage = useCallback(() => {
    setActiveLanguage(defaultLanguage);
  }, [defaultLanguage]);

  return {
    // State
    activeLanguage,
    
    // Actions
    getLabel,
    hasElementTranslations,
    getElementTranslationCount,
    getElementTranslations,
    switchLanguage,
    resetLanguage,
    
    // Utilities
    isCurrentLanguage: (languageCode: string) => languageCode === activeLanguage,
  };
} 