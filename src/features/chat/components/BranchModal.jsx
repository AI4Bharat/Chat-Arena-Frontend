import { X, GitBranch, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function BranchModal({ message, onClose, onBranchCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const isAssistantMessage = message?.role === 'assistant';

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await onBranchCreated(message, newTitle || null);
      onClose();
    } catch (error) {
      toast.error('Failed to create branch');
      console.error('Branch creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Branch Conversation</h2>
                <p className="text-sm text-orange-100">
                  {isAssistantMessage 
                    ? 'Continue from this response in a new session'
                    : 'Try a different question from this point'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="px-6 py-5 space-y-4">
            {/* Explanation */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <p>
                  {isAssistantMessage 
                    ? 'A new independent session will be created with the conversation up to this point. You can continue exploring from here without affecting the original chat.'
                    : 'This creates an alternative path in your conversation that you can switch between.'
                  }
                </p>
              </div>
            </div>

            {/* Preview of message being branched from */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Branching from this {message?.role === 'assistant' ? 'response' : 'message'}
              </label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 max-h-32 overflow-y-auto">
                {message?.content}
              </div>
            </div>

            {/* Optional: New session title */}
            {isAssistantMessage && (
              <div>
                <label htmlFor="newTitle" className="block text-sm font-medium text-gray-600 mb-2">
                  Session title (optional)
                </label>
                <input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Leave empty for auto-generated title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-shadow"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <GitBranch size={16} />
              {isSubmitting ? 'Creating Branch...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
