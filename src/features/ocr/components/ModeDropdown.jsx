import { useState, useRef, useEffect } from 'react';
import { Zap, Check, ChevronDown, GraduationCap } from 'lucide-react';

// OCR Arena currently supports direct mode only.
const MODES = {
  direct: { icon: Zap, label: 'Direct Mode', description: 'Analyse a document with one model.' },
  eduviz: { icon: GraduationCap, label: 'EduViz Benchmark', description: 'Teacher evaluation of student handwriting samples.' },
};

function useOutsideAlerter(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) callback();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

export function ModeDropdown({ currentMode, onModeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, () => setIsOpen(false));

  const mode = MODES[currentMode] || MODES.direct;
  const CurrentIcon = mode.icon;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-base font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-md"
      >
        <CurrentIcon size={18} />
        <span>{mode.label}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30 p-1 origin-top left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0">
          {Object.entries(MODES).map(([key, { icon: Icon, label, description }]) => {
            const isSelected = currentMode === key;
            return (
              <button
                key={key}
                onClick={() => { onModeChange(key); setIsOpen(false); }}
                className={`w-full text-left p-3 rounded-md hover:bg-gray-100 flex items-center gap-4 ${isSelected ? 'bg-gray-100' : ''}`}
              >
                <Icon size={20} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                {isSelected && <Check size={18} className="text-orange-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
