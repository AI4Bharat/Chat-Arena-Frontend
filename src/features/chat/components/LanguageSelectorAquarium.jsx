import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const languages = [
  { value: 'th', label: 'Thai' },
  { value: 'id', label: 'Indonesian' },
];

export function LanguageSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

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
    <div ref={wrapperRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-between items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span>{selectedLanguage?.label || 'Select Language'}</span>
        <ChevronDown className="ml-2 h-5 w-5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu">
            {languages.map((language) => (
              <button
                key={language.value}
                onClick={() => {
                  onChange(language.value);
                  setIsOpen(false);
                }}
                className={`${
                  value === language.value
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } group flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-100`}
                role="menuitem"
              >
                <span>{language.label}</span>
                {value === language.value && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
