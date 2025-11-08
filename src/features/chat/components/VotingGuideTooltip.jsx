import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Info } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 transition-all duration-300 ease-out transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
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
        {/* Swipe indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Info className="text-orange-600" size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">How voting works</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            We'll show you 2 responses from 2 anonymous models. 
            Please vote on the response you think is best. We will 
            reveal the models afterwards. If you like both responses, 
            use "It's a tie" button. If you do not like either, please use 
            the "Both are bad" button.
          </p>

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
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Mobile voting guide */}
          <div className="sm:hidden mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-3">Mobile voting guide:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-600">↑</span>
                <span>Top response is better</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 h-6 bg-green-100 rounded flex items-center justify-center text-green-600">👍👍</span>
                <span>Both responses are good (tie)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 h-6 bg-red-100 rounded flex items-center justify-center text-red-600">👎👎</span>
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