import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const ALL_LANGUAGES = [
  { value: 'en', label: 'English' }, { value: 'th', label: 'Thai' },
  { value: 'id', label: 'Indonesian' },
];

export function LanguageSelector({ value, onChange, availableLanguages = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const languages = useMemo(() => {
    if (!availableLanguages || availableLanguages.length === 0) {
      return ALL_LANGUAGES;
    }
    return ALL_LANGUAGES.filter(lang => availableLanguages.includes(lang.value));
  }, [availableLanguages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const selectedLanguage = languages.find(lang => lang.value === value);

  return (
    <div className="relative w-32 z-39" ref={wrapperRef} data-tour="tts-language-selector">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left px-2 py-1 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <span className="truncate">{selectedLanguage ? selectedLanguage.label : 'Select Language'}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 origin-bottom"
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {languages.map(lang => (
              <button
                type='button'
                key={lang.value}
                onClick={() => {
                  onChange({ target: { value: lang.value } });
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
              >
                <p className={`font-medium ${selectedLanguage && selectedLanguage.value === lang.value ? 'text-blue-600' : 'text-gray-800'}`}>
                  {lang.label}
                </p>
                {selectedLanguage && selectedLanguage.value === lang.value && <Check size={18} className="text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}