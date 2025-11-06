import { User, Bot, Copy, RefreshCw, Expand, Check } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { CodeBlock } from './CodeBlock';
import { ThinkBlock } from './ThinkBlock';

export function MessageItem({
  message,
  onRegenerate,
  onExpand,
  viewMode = 'single',
  modelName = 'Random',
  feedbackState = null,
  previewState = null,
  canRegenerate = true,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const contentRef = useRef(null);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const isThinkingModelRef = useRef(false);
  useEffect(() => {
    if (!isThinkingModelRef.current && message.content.trim().startsWith('<think>')) {
      isThinkingModelRef.current = true;
    }
  }, [message.content]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 10;
    setIsUserScrolledUp((prev) => (prev === !atBottom ? prev : !atBottom));
  }, []);
  
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (message.isStreaming && !isUserScrolledUp) {
      el.scrollTop = el.scrollHeight;
    }
  }, [message.content, message.isStreaming, isUserScrolledUp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const sections = useMemo(() => {
    const text = message.content || '';
  
    const isThinking = text.trim().startsWith('<think>');
    isThinkingModelRef.current = isThinking || isThinkingModelRef.current;
  
    if (!isThinkingModelRef.current) {
      return [{ type: 'normal', content: text }];
    }
  
    const thinkStart = text.indexOf('<think>');
    const thinkEnd = text.indexOf('</think>');
  
    if (thinkStart === 0) {
      if (thinkEnd === -1) {
        const content = text.replace(/^<think>/, '');
        return [{ type: 'think', content, open: message.isStreaming }];
      } else {
        const thinkContent = text
          .slice('<think>'.length, thinkEnd)
          .trim();
        const normalContent = text.slice(thinkEnd + '</think>'.length);
        return [
          { type: 'think', content: thinkContent, open: false },
          { type: 'normal', content: normalContent },
        ];
      }
    }
  
    return [{ type: 'normal', content: text }];
  }, [message.content, message.isStreaming]);

  const activeState = feedbackState || previewState;
  const cardClasses = clsx(
    'rounded-lg bg-white w-full flex flex-col border border-gray-200',
    {
      'outline outline-2': activeState,
      'outline-green-500': activeState === 'winner',
      'outline-red-500': activeState === 'loser',
      'animate-border-glow': previewState && !feedbackState,
      'glow-winner': previewState === 'winner',
      'glow-loser': previewState === 'loser',
      'h-full': viewMode === 'compare',
    }
  );

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="group flex items-start gap-3 justify-end">
          <div className="bg-orange-500 text-white px-3 py-2 rounded-lg max-w-2xl">
            <p>{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-600 rounded-full">
            <Bot size={14} className="text-white" />
          </div>
          <span
            className={clsx('font-medium text-sm', {
              'text-green-500':
                feedbackState === 'winner' || previewState === 'winner',
              'text-red-500':
                feedbackState === 'loser' || previewState === 'loser',
            })}
          >
            {modelName}
          </span>
        </div>
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-2 text-gray-500">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy Message"
            >
              {copied ? (
                <Check size={16} className="text-gray-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
            {canRegenerate && (
              <button
                onClick={() => onRegenerate(message)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Regenerate"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={() => onExpand(message)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Expand"
            >
              <Expand size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={contentRef}
        className={clsx(
          'p-4 flex-1 scroll-fade scrollbar-hide',
          {
            'max-h-[65vh] overflow-y-auto': viewMode === 'compare',
            'overflow-y-auto': viewMode === 'single',
          }
        )}
      >
        <div className="prose prose-sm max-w-none text-gray-900">
          {message.isStreaming &&
            (!message.content || message.content.trim().length === 0) &&
            !isThinkingModelRef.current && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" />
            )}

          {sections.map((sec, i) =>
            sec.type === 'think' ? (
              <ThinkBlock
                key={i}
                content={sec.content}
                isStreaming={sec.open}
              />
            ) : (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm]}
                components={{ code: CodeBlock, pre: ({ children }) => <>{children}</> }}
              >
                {sec.content}
              </ReactMarkdown>
            )
          )}

          {message.isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}