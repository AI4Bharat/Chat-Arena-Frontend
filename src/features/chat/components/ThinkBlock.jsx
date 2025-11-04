import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ThinkBlock({
  content,
  isOpenInitially = false,
  isStreaming = false,
}) {
  const [isOpen, setIsOpen] = useState(isOpenInitially);

  const open = isStreaming ? true : isOpen;
  const toggle = () => setIsOpen(o => !o);

  const showStreamingCursor = isStreaming && (!content || content.trim().length === 0);

  return (
    <div className="not-prose my-3 border border-gray-200 bg-gray-50 rounded-lg transition-all duration-200">
      <button
        onClick={toggle}
        disabled={isStreaming}
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-gray-500 flex-shrink-0" />
          <span>Thought Process</span>
          {showStreamingCursor && (
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 align-middle rounded-sm" />
          )}
        </div>
        {isStreaming ? (
          <span className="text-xs text-gray-600 font-normal italic animate-pulse">
            Thinking
          </span>
        ) : open ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 text-sm text-gray-900 leading-relaxed border-t border-gray-100 break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || (isStreaming ? '_Thinking…_' : '')}
          </ReactMarkdown>

          {isStreaming && content && (
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 align-middle rounded-sm" />
          )}
        </div>
      )}
    </div>
  );
}