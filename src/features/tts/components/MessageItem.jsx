import { User, Bot, Copy, RefreshCw, Expand, Check, AlertTriangle, ThumbsUp, ThumbsDown, Play, Pause, Loader2, Download, Mic } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { ProviderIcons } from '../../../shared/icons';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useDispatch } from 'react-redux';
import { updateMessageRating } from '../store/chatSlice';
import { AudioMessageBubble } from './AudioMessageBubble';

function InlineErrorIndicator({ error, onRegenerate, canRegenerate }) {
  return (
    <div className="not-prose mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex flex-col sm:flex-row items-center gap-3 text-left">
      <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
      <div className="flex-grow">
        <p className="text-sm font-semibold text-red-800">Generation Failed</p>
        <p className="text-xs text-red-700 mt-1 break-words">
          {error || 'An unexpected error occurred.'}
        </p>
      </div>
      {canRegenerate &&
        <button
          onClick={onRegenerate}
          className="mt-2 sm:mt-0 flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Try Again
        </button>}
    </div>
  );
}

export function MessageItem({
  message,
  onRegenerate,
  onExpand,
  viewMode = 'single',
  modelName = 'Random',
  feedbackState = null,
  previewState = null,
  canRegenerate = true,
  sessionMode = 'random',
  sessionId = null,
  otherModelContent = null,
  session = null,
}) {
  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(message.feedback || null);
  const dispatch = useDispatch();
  const isUser = message.role === 'user';
  const contentRef = useRef(null);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // const isThinkingModelRef = useRef(false);
  // useEffect(() => {
  //   if (!isThinkingModelRef.current && message?.content?.trim().startsWith('<think>')) {
  //     isThinkingModelRef.current = true;
  //   }
  // }, [message?.content]);

  const getModelIcon = useCallback(() => {
    if (modelName === 'Random') {
      return <Bot size={14} className="text-orange-500" />;
    }

    // Regex to extract first word: split by space, hyphen, or underscore
    const firstWord = modelName.split(/[\s\-_]+/)[0].toLowerCase();

    // Look up in ProviderIcons map
    const Icon = ProviderIcons[firstWord];

    if (Icon) {
      return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
    }

    // Fallback to Bot icon
    return <Bot size={14} className="text-orange-500" />;
  }, [modelName]);

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

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeedbackClick = async (feedbackType) => {
    if (!sessionId || !message.id) {
      toast.error('Unable to submit feedback');
      return;
    }

    const newFeedback = localFeedback === feedbackType ? null : feedbackType;

    try {
      await apiClient.post(endpoints.feedback.submit, {
        session_id: sessionId,
        feedback_type: 'rating',
        message_id: message.id,
        rating: newFeedback === 'like' ? 5 : 1,
        preference: newFeedback,
      });
      toast.success('Feedback submitted');

      setLocalFeedback(newFeedback);

      dispatch(updateMessageRating({ 
        sessionId: sessionId, 
        messageId: message.id, 
        rating: newFeedback,
      }));

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  // const sections = useMemo(() => {
  //   const text = message.content || '';

  //   const isThinking = text.trim().startsWith('<think>');
  //   isThinkingModelRef.current = isThinking || isThinkingModelRef.current;

  //   if (!isThinkingModelRef.current) {
  //     return [{ type: 'normal', content: text }];
  //   }

  //   const thinkStart = text.indexOf('<think>');
  //   const thinkEnd = text.indexOf('</think>');

  //   if (thinkStart === 0) {
  //     if (thinkEnd === -1) {
  //       const content = text.replace(/^<think>/, '');
  //       return [{ type: 'think', content, open: message.isStreaming }];
  //     } else {
  //       const thinkContent = text
  //         .slice('<think>'.length, thinkEnd)
  //         .trim();
  //       const normalContent = text.slice(thinkEnd + '</think>'.length);
  //       return [
  //         { type: 'think', content: thinkContent, open: false },
  //         { type: 'normal', content: normalContent },
  //       ];
  //     }
  //   }

  //   return [{ type: 'normal', content: text }];
  // }, [message.content, message.isStreaming]);

  // Check if we should use diff highlighting
  // const shouldUseDiffHighlighting = useMemo(() => {
  //   // Since we're in TTS components, we don't need to check session_type
  //   // Just verify we're in compare/random mode with two different texts
  //   const result = (
  //     session &&
  //     (session.mode === 'compare' || session.mode === 'random') &&
  //     viewMode === 'compare' &&
  //     otherModelContent &&
  //     message.content &&
  //     !message.isStreaming &&
  //     message.role === 'assistant'
  //   );
    
  //   return result;
  // }, [session, viewMode, otherModelContent, message.content, message.isStreaming, message.role]);

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
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const showFeedbackButtons = sessionMode === 'direct' && message.temp_audio_url;

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded-full">
            {getModelIcon()}
          </div>
          <span
            className={clsx('font-medium text-sm', {
              'text-green-500':
                activeState === 'winner',
              'text-red-500':
                activeState === 'loser',
            })}
          >
            {modelName}
          </span>
        </div>
        {!message.isStreaming && message?.temp_audio_url && (
          <div className="flex items-center gap-2 text-gray-500">
            <button
              onClick={() => handleCopy(message?.temp_audio_url)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy Audio URL"
            >
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>

            {showFeedbackButtons && (
              <>
                {(!localFeedback || localFeedback === 'like') && (
                  <button
                    onClick={() => !localFeedback && handleFeedbackClick('like')}
                    disabled={!!localFeedback}
                    className={clsx(
                      "p-1 rounded transition-colors",
                      localFeedback === 'like'
                        ? "text-green-600"
                        : "text-gray-500 hover:bg-gray-100 hover:text-green-600"
                    )}
                    title={localFeedback === 'like' ? "You liked this" : "Like"}
                  >
                    <ThumbsUp
                      size={16}
                    />
                  </button>
                )}

                {(!localFeedback || localFeedback === 'dislike') && (
                  <button
                    onClick={() => !localFeedback && handleFeedbackClick('dislike')}
                    disabled={!!localFeedback}
                    className={clsx(
                      "p-1 rounded transition-colors",
                      localFeedback === 'dislike'
                        ? "text-red-600"
                        : "text-gray-500 hover:bg-gray-100 hover:text-red-600"
                    )}
                    title={localFeedback === 'dislike' ? "You disliked this" : "Dislike"}
                  >
                    <ThumbsDown
                      size={16}
                    />
                  </button>
                )}
              </>
            )}
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
          'p-4 flex-1',
          {
            'max-h-[65vh] overflow-y-auto': viewMode === 'compare',
            'overflow-y-auto': viewMode === 'single',
          }
        )}
      >
        <div className="prose prose-sm max-w-none text-gray-900">
          {message.isStreaming &&
            (!message.content || message.content.trim().length === 0) &&
            // !isThinkingModelRef.current && ((modelName !== "GPT 5" && modelName !== "GPT 5 Pro" && modelName !== "Gemini 2.5 Pro" && modelName !== "Gemini 3 Pro")?
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" /> 
              // :
              // <span className="text-xs text-gray-600 font-normal italic animate-pulse">
              //   Thinking...
              // </span>
          }

          {!message.isStreaming && message?.temp_audio_url &&
            <div className=" text-gray-800 px-3 py-2 rounded-lg border border-gray-200">
              <AudioMessageBubble audioUrl={message.temp_audio_url} language={message?.language} />
            </div>
          }

          {message.isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" />
          )}

          {message.status === 'error' && (
            <InlineErrorIndicator
              error={message.error}
              onRegenerate={() => onRegenerate(message)}
              canRegenerate={canRegenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}