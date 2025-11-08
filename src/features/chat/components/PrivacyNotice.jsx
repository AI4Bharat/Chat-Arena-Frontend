import { Shield, Info } from 'lucide-react';

export function PrivacyNotice() {
  return (
    <div className="w-full px-2 sm:px-4 mt-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <Shield size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-800">
            <p className="font-medium mb-1 text-xs">Privacy Notice</p>
            <p className="text-blue-700 text-xs">
              Your conversations may be used to improve our AI models. Please don't share personal, 
              sensitive, or confidential information. By using this service, you agree to our{' '}
              <a 
                href="#privacy-policy" 
                className="underline hover:text-blue-900 transition-colors"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a 
                href="#terms-of-service" 
                className="underline hover:text-blue-900 transition-colors"
              >
                Terms of Service
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}