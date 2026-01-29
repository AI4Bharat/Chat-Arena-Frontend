import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const ALL_LANGUAGES = [
  { value: 'th', label: 'Thai' },
  { value: 'ind', label: 'Indonesian' },
];

export function LanguageSelector({ value, onChange, availableLanguages = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Filter languages based on availableLanguages prop
  const languages = useMemo(() => {
    if (!availableLanguages || availableLanguages.length === 0) {
      return ALL_LANGUAGES;
    }
    return ALL_LANGUAGES.filter(lang => availableLanguages.includes(lang.value));
  }, [availableLanguages]);

  // Auto-correct selection if current value is not in available languages
  useEffect(() => {
    if (languages.length > 0 && !languages.find(lang => lang.value === value)) {
      onChange(languages[0].value);
    }
  }, [languages, value, onChange]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLanguage = languages.find(lang => lang.value === value) || languages[0];

  // Don't render if no languages available
  if (languages.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-gray-700 dark:text-gray-300">
          {selectedLanguage?.label || 'Select Language'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => {
                  onChange(lang.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {lang.label}
                </span>
                {value === lang.value && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
