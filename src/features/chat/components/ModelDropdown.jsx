import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

function useOutsideAlerter(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export function ModelDropdown({ models, selectedModelId, onSelect, disabled = false, fullWidth = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, () => setIsOpen(false));

  const selectedModel = models.find(m => m.id === selectedModelId);

  const filteredModels = models.filter(model =>
    model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const buttonText = selectedModel?.display_name || '...'; 

  const containerWidthClass = fullWidth ? 'w-64 sm:w-56' : 'w-40 sm:w-56';

  return (
    <div className={`relative ${containerWidthClass}`} ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between text-left px-3 py-2.5 bg-white dark:bg-gray-800 border border-orange-200/50 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <span className="truncate font-medium">{buttonText}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-3 w-full bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl 
                     shadow-[0_8px_24px_rgba(230,126,34,0.15)] dark:shadow-[0_8px_24px_rgba(230,126,34,0.25)]
                     z-20 origin-top transition-all duration-200 ease-out opacity-100 scale-100"
        >
          <div className="p-3 border-b border-orange-100 dark:border-gray-700">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-gray-50 dark:bg-gray-900 border border-orange-200/50 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl pl-10 pr-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin">
            {filteredModels.map(model => (
              <button
                key={model.id}
                onClick={() => { onSelect(model); setIsOpen(false); }}
                className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
                  ${selectedModelId === model.id 
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20' 
                    : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
              >
                <p className={`text-sm font-medium ${selectedModelId === model.id ? 'text-orange-700 dark:text-orange-300' : 'text-gray-800 dark:text-gray-200'}`}>
                  {model.display_name}
                </p>
                {selectedModelId === model.id && (
                  <Check size={18} className="text-orange-600 dark:text-orange-500" />
                )}
              </button>
            ))}
            {filteredModels.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No models found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}