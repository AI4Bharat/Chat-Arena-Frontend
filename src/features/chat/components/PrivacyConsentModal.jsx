import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Info } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 transition-all duration-300 ease-out transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <Shield className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Privacy Agreement</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Before we proceed:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Your conversations may be used to improve our AI models</li>
                <li>• Please don't share personal, sensitive, or confidential information</li>
                <li>• Your data is handled according to our privacy policy</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            By continuing, you agree to our{' '}
            <a 
              href="#privacy-policy" 
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              Privacy Policy
            </a>
            {' '}and{' '}
            <a 
              href="#terms-of-service" 
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              Terms of Service
            </a>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onDecline}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <XCircle size={16} />
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
          >
            <CheckCircle size={16} />
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}