import { Info } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

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
      <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-[#3a3a3a] border border-orange-200 dark:border-[#555] rounded-lg text-xs shadow-sm">
        <Info size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-orange-800 dark:text-orange-300">
          <p className="text-orange-700 dark:text-orange-200">
            Your conversations may be used to improve our AI models. Please don't share personal
            or sensitive information. By using this service, you agree to our{' '}
            <Link 
              to="/privacy" 
              className="font-medium underline hover:text-orange-900 dark:hover:text-orange-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link 
              to="/terms" 
              className="font-medium underline hover:text-orange-900 dark:hover:text-orange-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
