import { useState, useRef, useEffect } from 'react';
import { Zap, GitCompare, Shuffle, Check, ChevronDown } from 'lucide-react';

const MODES = {
  direct: { icon: Zap, label: 'Direct Chat', description: 'Chat with one model at a time.' },
  compare: { icon: GitCompare, label: 'Compare Models', description: 'Compare 2 models of your choice.' },
  random: { icon: Shuffle, label: 'Random', description: 'Compare 2 anonymous models.' },
};

function useOutsideAlerter(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export function ModeDropdown({ currentMode, onModeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, () => setIsOpen(false));

  const CurrentIcon = MODES[currentMode].icon;

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2.5 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-2.5 rounded-xl transition-all duration-200"
      >
        <CurrentIcon size={18} className="text-orange-600 dark:text-orange-500" />
        <span>{MODES[currentMode].label}</span>
        <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl 
                     shadow-[0_8px_24px_rgba(230,126,34,0.15)] dark:shadow-[0_8px_24px_rgba(230,126,34,0.25)]
                     border border-orange-100 dark:border-gray-700 z-30 p-2
                     origin-top transition-all duration-200 ease-out
                     opacity-100 scale-100
                     left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0"
        >
          {Object.entries(MODES).map(([key, { icon: Icon, label, description }]) => {
            const isSelected = currentMode === key;
            return (
              <button
                key={key}
                onClick={() => { onModeChange(key); setIsOpen(false); }}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4 group
                  ${isSelected 
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20' 
                    : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 dark:group-hover:text-orange-500'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[15px] ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={20} className="text-orange-600 dark:text-orange-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}