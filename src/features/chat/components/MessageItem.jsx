import { User, Bot, Copy, RefreshCw, GitBranch, Expand } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

export function MessageItem({ message, onRegenerate, onExpand, viewMode = 'single', modelName = 'Random', feedbackState = null, previewState = null, canRegenerate = true }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const contentRef = useRef(null);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  useEffect(() => {
    handleScroll();
  }, [message.content]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = el.scrollHeight > el.clientHeight && el.scrollHeight - el.scrollTop > el.clientHeight + 2;
    setScrollState({ canScrollUp, canScrollDown });
  };

  useEffect(() => {
    if (contentRef.current && message.isStreaming && !isUserScrolledUp) {
      const element = contentRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [message.content, message.isStreaming, isUserScrolledUp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-6">
        <div className="group flex items-start gap-3 justify-end w-full">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-5 py-3.5 rounded-[18px] shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto sm:max-w-[75%]">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderActionIcons = () => (
    <div className="flex items-center gap-1">
      <button 
        onClick={handleCopy} 
        className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 rounded-xl transition-all duration-200" 
        title="Copy"
      >
        <Copy size={16} />
      </button>
      {canRegenerate && (
      <button 
        onClick={() => onRegenerate(message)} 
        className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 rounded-xl transition-all duration-200" 
        title="Regenerate"
      >
        <RefreshCw size={16} />
      </button>
      )}
      <button 
        onClick={() => onExpand(message)} 
        className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 rounded-xl transition-all duration-200" 
        title="Expand"
      >
        <Expand size={16} />
      </button>
    </div>
  );

  const cardContainerClasses = viewMode === 'compare' ? 'w-full h-full flex flex-col' : 'w-full flex flex-col';
  const scrollableContentClasses = viewMode === 'compare' ? 'p-4 flex-1 max-h-[65vh] overflow-y-auto' : 'p-4 flex-1';

  const activeState = feedbackState || previewState;

  const cardClasses = clsx(
    'rounded-[20px] bg-white dark:bg-gray-800 w-full flex flex-col box-border transition-all duration-300',
    { 'h-full': viewMode === 'compare' },
    'border shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]',
    {
      'border-orange-200 dark:border-orange-800/50': !activeState,
      'border-green-400 dark:border-green-600': activeState === 'winner',
      'border-red-400 dark:border-red-600': activeState === 'loser',
    },
    {
      'outline outline-2 outline-offset-2': activeState,
      'outline-green-400/50': activeState === 'winner',
      'outline-red-400/50': activeState === 'loser',
    },
    {
      'animate-border-glow': previewState && !feedbackState,
      'glow-winner': previewState === 'winner',
      'glow-loser': previewState === 'loser',
    },
    'hover:shadow-[0_4px_20px_rgba(230,126,34,0.08)] dark:hover:shadow-[0_4px_20px_rgba(230,126,34,0.15)]'
  );

  return (
    <div className="my-6">
  <div className={cardClasses}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-orange-100 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-sm">
              <Bot size={16} className="text-white" />
            </div>
            <span className={clsx(
              "font-medium text-[15px]", 
              {
                'text-green-600 dark:text-green-500': feedbackState === 'winner' || previewState === 'winner',
                'text-red-600 dark:text-red-500': feedbackState === 'loser' || previewState === 'loser',
                'text-gray-700 dark:text-gray-200': !activeState
              }
            )}>
              {modelName}
            </span>
          </div>
          {!message.isStreaming && message.content && renderActionIcons()}
        </div>

        <div 
          ref={contentRef} 
          onScroll={handleScroll} 
          className={clsx(
            'px-5 py-4 flex-1 scroll-fade scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-orange-800/50 scrollbar-track-transparent hover:scrollbar-thumb-orange-300 dark:hover:scrollbar-thumb-orange-700/60',
            {
              'max-h-[65vh] overflow-y-auto': viewMode === 'compare',
              'overflow-y-auto': viewMode === 'single'
            }
          )}
        >
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:leading-relaxed prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-code:text-orange-600 dark:prose-code:text-orange-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {message.isStreaming && <span className="inline-block w-2 h-5 bg-orange-500 dark:bg-orange-600 animate-pulse ml-1 rounded-sm" />}
          </div>
        </div>
      </div>
    </div>
  );
}