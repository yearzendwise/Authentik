import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Globe, Plus } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  currentTranslations: Record<string, string>;
  onTranslationsUpdate: (translations: Record<string, string>) => void;
  originalLabel: string;
}

export function LanguageSelector({
  currentTranslations,
  onTranslationsUpdate,
  originalLabel,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Use currentTranslations directly instead of local state
  const translations = currentTranslations || {};

  const handleAddLanguage = (languageCode: string) => {
    if (!translations[languageCode]) {
      const newTranslations = {
        ...translations,
        [languageCode]: originalLabel, // Default to original label
      };
      onTranslationsUpdate(newTranslations);
    }
  };

  const handleRemoveLanguage = (languageCode: string) => {
    const newTranslations = { ...translations };
    delete newTranslations[languageCode];
    onTranslationsUpdate(newTranslations);
  };

  const handleTranslationChange = (languageCode: string, value: string) => {
    const newTranslations = {
      ...translations,
      [languageCode]: value,
    };
    onTranslationsUpdate(newTranslations);
  };

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    lang => !translations[lang.code]
  );

  const activeLanguages = SUPPORTED_LANGUAGES.filter(
    lang => translations[lang.code]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0 border-dashed hover:bg-blue-50 hover:border-blue-300 transition-colors relative"
          title="Add translations"
        >
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          {Object.keys(translations).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {Object.keys(translations).length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="translation-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Label Translations
          </DialogTitle>
        </DialogHeader>
        <div id="translation-description" className="sr-only">
          Add and manage translations for form element labels in different languages
        </div>
        
        <div className="space-y-6">
          {/* Original Label Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Original Label (English)
            </Label>
            <div className="font-medium text-gray-900">{originalLabel}</div>
          </div>

          {/* Active Translations */}
          {activeLanguages.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Active Translations
              </Label>
              <div className="space-y-3">
                {activeLanguages.map((language) => (
                  <div key={language.code} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {language.name}
                      </div>
                      <Input
                        value={translations[language.code] || ''}
                        onChange={(e) => handleTranslationChange(language.code, e.target.value)}
                        placeholder={`Enter ${language.name} translation`}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLanguage(language.code)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Language */}
          {availableLanguages.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Add Translation
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableLanguages.map((language) => (
                  <Button
                    key={language.code}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLanguage(language.code)}
                    className="justify-start gap-2 h-auto p-2"
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span className="text-xs">{language.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {activeLanguages.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>{activeLanguages.length}</strong> translation{activeLanguages.length !== 1 ? 's' : ''} added
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {activeLanguages.map((lang) => (
                  <Badge key={lang.code} variant="secondary" className="text-xs">
                    {lang.flag} {lang.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}