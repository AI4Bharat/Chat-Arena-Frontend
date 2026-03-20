import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Paperclip } from 'lucide-react';
import { ProviderIcons } from '../../../shared/icons';
const MONOCHROME_PROVIDERS = ['openai', 'anthropic', 'claude', 'sarvam'];

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
  const hasSelectedCapabilities = selectedModel?.capabilities && selectedModel.capabilities.length > 0;


  const filteredModels = models.filter(model =>
    model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const buttonText = selectedModel?.display_name || '...';
  const modelProvider = selectedModel?.provider || '';
  const Icon = ProviderIcons[modelProvider] ?? null;
  const isSelectedMultimodal = hasSelectedCapabilities;


  const containerWidthClass = fullWidth ? 'w-64 sm:w-56' : 'w-40 sm:w-56';

  return (
    <div className={`relative ${containerWidthClass}`} ref={wrapperRef} data-tour="model-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center text-left p-2 bg-white dark:bg-[#2a2a2a] border border-transparent rounded-md text-sm sm:text-base text-gray-800 dark:text-[#ececec] hover:bg-gray-100 dark:hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
<span className='mr-2 shrink-0'>{Icon && <Icon className={`h-4 w-4 shrink-0 ${MONOCHROME_PROVIDERS.includes(modelProvider) ? 'dark:brightness-0 dark:invert dark:opacity-80' : 'dark:opacity-90'}`} aria-hidden="true" />}</span>     
   <span className="truncate font-medium">{buttonText}</span>
        {isSelectedMultimodal && (
          <Paperclip
            size={14}
            className="text-green-600 shrink-0 ml-1"
            title="Supports attachments (Images, Docs, Audio)"
          />
        )}
        <ChevronDown size={16} className={`transition-transform duration-200 text-gray-500 dark:text-[#a0a0a0] ml-auto shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 min-w-full w-48 sm:w-max max-w-sm bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg shadow-xl z-20
          origin-top transition-all duration-200 ease-out
          opacity-100 scale-100
          left-1/2 -translate-x-1/2"
        >
          <div className="p-2 border-b border-gray-200 dark:border-[#3a3a3a]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a0a0a0]" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-gray-50 dark:bg-[#333333] text-gray-800 dark:text-[#ececec] placeholder:text-gray-400 dark:placeholder:text-[#a0a0a0] border border-gray-200 dark:border-[#3a3a3a] rounded-md pl-10 pr-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredModels.map((model) => {
              const Icon = ProviderIcons[model.provider] ?? null;
              const isMultimodal = model.capabilities && model.capabilities.length > 0;
              return (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model); setIsOpen(false); }}
                  className={`w-full text-left flex items-center justify-between p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors ${selectedModelId === model.id ? "bg-gray-100 dark:bg-[#333333]" : ""}`}
                >
                  <span className="flex items-center gap-2 sm:whitespace-nowrap">
{Icon && <Icon className={`h-4 w-4 shrink-0 ${MONOCHROME_PROVIDERS.includes(model.provider) ? 'dark:brightness-0 dark:invert dark:opacity-80' : 'dark:opacity-90'}`} aria-hidden="true" />}                  <p className={`text-sm font-medium break-words ${selectedModelId === model.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-[#ececec]'}`}> {model.display_name}</p>                    {isMultimodal && (
                      <Paperclip
                        size={14}
                        className="text-green-600 shrink-0"
                        title="Supports attachments (Images, Docs, Audio)"
                      />
                    )}
                  </span>
                  {selectedModelId === model.id && <Check size={18} className="text-orange-500 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}