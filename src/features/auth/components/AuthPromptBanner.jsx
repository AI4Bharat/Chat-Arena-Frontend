import { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Sparkles } from 'lucide-react';
import { AuthModal } from './AuthModal';

export function AuthPromptBanner() {
  const { isAnonymous } = useSelector((state) => state.auth);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAnonymous || isDismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} />
              <span className="text-sm font-medium">
                You're using a guest account. Sign in to save your conversations permanently.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Sign in
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}