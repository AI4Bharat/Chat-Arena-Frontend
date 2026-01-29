import { useState, useEffect, useRef } from 'react';
import { Info, ThumbsUp, ThumbsDown, ArrowUp, ArrowDown } from 'lucide-react';

const GuideItem = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-8 mt-1 bg-gray-100 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );

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
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const diffY = currentY.current - startY.current;
    if (diffY > 0) setDragY(diffY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const diffY = currentY.current - startY.current;
    if (diffY > 100) onClose();
    else setDragY(0);
    setIsDragging(false);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ease-out ${
        isVisible ? 'bg-black bg-opacity-60' : 'bg-opacity-0'
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
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="flex items-center justify-center gap-3 p-5 text-center border-b border-gray-200">
          <Info className="text-orange-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">How voting works</h2>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-center text-gray-600">
            Your feedback helps us improve. Use the buttons to compare the two AI responses.
          </p>
          <div className="space-y-4">
            <GuideItem 
              icon={<div className="flex gap-1"><ArrowUp size={16} /><ThumbsUp size={16} /></div>}
              title="Top is Better"
              description="Choose if the first response is clearly better."
            />
            <GuideItem 
              icon={<div className="flex gap-1"><ThumbsUp size={16} /><ThumbsUp size={16} /></div>}
              title="Both are Good"
              description="Use when both responses are helpful and high-quality."
            />
            <GuideItem 
              icon={<div className="flex gap-1"><ThumbsDown size={16} /><ThumbsDown size={16} /></div>}
              title="Both are Bad"
              description="Pick if both responses are unhelpful or inaccurate."
            />
            <GuideItem 
              icon={<div className="flex gap-1"><ArrowDown size={16} /><ThumbsUp size={16} /></div>}
              title="Bottom is Better"
              description="Choose if the second response is the clear winner."
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onGotIt}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}