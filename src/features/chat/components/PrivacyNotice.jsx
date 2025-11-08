import { Info } from 'lucide-react';
import React from 'react';

export function PrivacyNotice() {
  return (
    <div
      className={`
        absolute w-full px-2 sm:px-0
        bottom-full mb-2
        sm:top-full sm:bottom-auto sm:mt-2 sm:mb-0
        transition-all duration-300 ease-in-out
        opacity-100 translate-y-0
      `}
    >
      <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs shadow-sm">
        <Info size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-orange-800">
          <p className="text-orange-700">
            Your conversations may be used to improve our AI models. Please don't share personal
            or sensitive information. By using this service, you agree to our{' '}
            <a href="#" className="font-medium underline hover:text-orange-900 transition-colors">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="#" className="font-medium underline hover:text-orange-900 transition-colors">
              Terms of Service
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
