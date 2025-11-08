import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Info, X, ThumbsUp, ThumbsDown } from 'lucide-react';

export function VotingGuideTooltip({ isOpen, onClose, onGotIt }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    currentY.current = e.touches[0].clientY;
    const diffY = currentY.current - startY.current;
    
    // Only allow downward swipes
    if (diffY > 0) {
      setDragY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diffY = currentY.current - startY.current;
    
    // If swiped down more than 100px, close the modal
    if (diffY > 100) {
      onClose();
    } else {
      // Snap back to original position
      setDragY(0);
    }
    
    setIsDragging(false);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-out ${
        isVisible 
          ? 'bg-black bg-opacity-50 backdrop-blur-sm' 
          : 'bg-opacity-0 backdrop-blur-none'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-md w-full border border-gray-200 transition-all duration-300 ease-out transform ${
          isVisible 
            ? 'translate-y-0 opacity-100 sm:scale-100' 
            : 'translate-y-full opacity-0 sm:scale-95 sm:translate-y-4'
        }`}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'all 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe indicator for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full">
              <Info className="text-orange-600" size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">How voting works</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close voting guide"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <p>This guide helps users compare two responses in a voting interface. Use ↑ if the top response is better, ↓ if the bottom one is better. <ThumbsUp className="inline w-4 h-4" /><ThumbsUp className="inline w-4 h-4" /> means both are good, <ThumbsDown className="inline w-4 h-4" /><ThumbsDown className="inline w-4 h-4" /> means both are bad.</p>
            </div>
          </div>

          {/* Learn more link */}
          <div className="mt-4">
            <button 
              className="text-orange-600 text-sm font-medium hover:text-orange-800 transition-colors flex items-center gap-1"
              onClick={() => {
                // I can later implement navigation to detailed guide here
                console.log('Learn more about How it Works');
              }}
            >
              Learn more about How it Works 
            </button>
          </div>

          {/* Mobile voting guide */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-3">Mobile voting guide:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-600">↑</span>
                <span>Top response is better</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 h-6 bg-green-100 rounded flex items-center justify-center text-green-600 gap-0.5">
                  <ThumbsUp size={10} />
                  <ThumbsUp size={10} />
                </span>
                <span>Both responses are good</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 h-6 bg-red-100 rounded flex items-center justify-center text-red-600 gap-0.5">
                  <ThumbsDown size={10} />
                  <ThumbsDown size={10} />
                </span>
                <span>Both responses are bad</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-600">↓</span>
                <span>Bottom response is better</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onGotIt}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}