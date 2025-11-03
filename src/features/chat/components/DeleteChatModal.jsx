import { AlertCircle, Trash2 } from 'lucide-react';

export function DeleteChatModal({ isOpen, chatTitle, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Delete Chat?</h2>
          </div>
          
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete this chat?
          </p>
          <p className="text-gray-500 text-sm mb-6 break-words">
            <strong>"{chatTitle || 'Untitled'}"</strong>
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
