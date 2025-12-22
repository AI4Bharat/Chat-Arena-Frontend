import { useState, useEffect } from 'react';
import { BotMessageSquare, CheckCircle, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyConsentModal({ isOpen, onAccept, onDecline }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Slight delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onDecline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDecline]);


  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-out ${
        isVisible
          ? 'bg-black bg-opacity-50 backdrop-blur-sm'
          : 'bg-opacity-0 backdrop-blur-none'
      }`}
      onClick={onDecline}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-md w-full border border-gray-200 transition-all duration-300 ease-out transform ${
          isVisible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:scale-95 sm:translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-full">
                <BotMessageSquare className="text-orange-600" size={24} />
             </div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy Agreement</h2>
          </div>
          <button
            onClick={onDecline}
            aria-label="Close privacy agreement"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3 text-sm text-gray-700">
             <div className="flex items-start gap-3">
                <Info className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                <p>Your conversations may be used to improve our AI models.</p>
             </div>
             <div className="flex items-start gap-3">
                <Info className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                <p>Please don't share personal, sensitive, or confidential information.</p>
             </div>
             <div className="flex items-start gap-3">
                <Info className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                <p>Your data is handled according to our privacy policy.</p>
             </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            By continuing, you agree to our{' '}
            <Link
              to="/privacy"
              className="font-medium text-orange-600 underline hover:text-orange-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link
              to="/terms"
              className="font-medium text-orange-600 underline hover:text-orange-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>.
          </p>
        </div>

        <div className="p-5 border-t border-gray-200">
          <button
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <CheckCircle size={16} />
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}