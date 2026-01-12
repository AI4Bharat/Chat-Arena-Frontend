import { ChevronLeft, ChevronRight, GitBranch } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { selectBranch } from '../store/chatSlice';

/**
 * BranchNavigator - Shows navigation arrows when there are sibling messages
 * at a branch point (multiple responses to the same parent message)
 */
export function BranchNavigator({ 
  message, 
  siblings, 
  currentIndex, 
  sessionId,
  parentMessageId 
}) {
  const dispatch = useDispatch();
  
  // Don't render if no siblings or only one message
  if (!siblings || siblings.length <= 1) {
    return null;
  }

  // Ensure currentIndex is valid
  const safeIndex = Math.max(0, Math.min(currentIndex || 0, siblings.length - 1));

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (safeIndex > 0) {
      const prevSibling = siblings[safeIndex - 1];
      dispatch(selectBranch({
        sessionId,
        parentMessageId: parentMessageId || 'root',
        selectedChildId: prevSibling.id
      }));
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (safeIndex < siblings.length - 1) {
      const nextSibling = siblings[safeIndex + 1];
      dispatch(selectBranch({
        sessionId,
        parentMessageId: parentMessageId || 'root',
        selectedChildId: nextSibling.id
      }));
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-full px-1 py-0.5 shadow-sm">
      <button
        onClick={handlePrevious}
        disabled={safeIndex === 0}
        className={`p-1 rounded-full transition-all ${
          safeIndex === 0 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-orange-600 hover:bg-orange-100 cursor-pointer'
        }`}
        title="Previous branch"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>
      
      <div className="flex items-center gap-1.5 px-2 py-0.5">
        <GitBranch size={14} className="text-orange-500" />
        <span className="text-sm font-semibold text-orange-700">
          {safeIndex + 1}
          <span className="text-orange-400 font-normal">/{siblings.length}</span>
        </span>
      </div>
      
      <button
        onClick={handleNext}
        disabled={safeIndex === siblings.length - 1}
        className={`p-1 rounded-full transition-all ${
          safeIndex === siblings.length - 1 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-orange-600 hover:bg-orange-100 cursor-pointer'
        }`}
        title="Next branch"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}