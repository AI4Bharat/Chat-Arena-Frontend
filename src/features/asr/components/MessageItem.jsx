import { User, Bot, Copy, RefreshCw, Expand, Check, AlertTriangle, ThumbsUp, ThumbsDown, Play, Pause, Loader2, Download, Mic } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { CodeBlock } from './CodeBlock';
import { ThinkBlock } from './ThinkBlock';
import { DiffHighlighter } from './DiffHighlighter';
import { ProviderIcons } from '../../../shared/icons';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useDispatch } from 'react-redux';
import { updateMessageRating } from '../store/chatSlice';
import WaveSurfer from 'wavesurfer.js';

function InlineErrorIndicator({ error, onRegenerate, canRegenerate }) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="not-prose mt-4 p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        
        <div className="flex-grow min-w-0">
          <p className="text-sm font-semibold text-orange-900">Generation failed</p>
          <p className="text-sm text-orange-800 mt-1">This model landed into an issue.</p>
          
          {error && error !== 'An unexpected error occurred.' && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline font-medium"
            >
              {showDetails ? 'Hide details' : 'View details'}
            </button>
          )}
          
          {showDetails && error && (
            <div className="mt-3 p-2 bg-white bg-opacity-60 rounded border border-orange-200 text-xs text-gray-600 font-mono break-words max-h-24 overflow-y-auto">
              {error}
            </div>
          )}
        </div>
        
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            className="mt-3 sm:mt-0 flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

const AudioMessageBubble = ({ audioUrl, language }) => {
  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!audioUrl || isDownloading) return;

    try {
      setIsDownloading(true);

      // 1. Fetch the file manually as a Blob
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();

      // 2. Create a temporary URL for that Blob
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Force download using the Blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `audio-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 4. Cleanup
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback: If blob fetch fails, try opening in new tab
      window.open(audioUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    setIsLoading(true);

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(255, 255, 255, 0.5)',
      progressColor: '#ffffff',
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 32,
      normalize: true,
    });

    wavesurfer.current.load(audioUrl).catch((err) => {
      if (err.name === 'AbortError' || err.message === 'Fetch is aborted') {
        return;
      }
      console.error('WaveSurfer load error:', err);
      setIsLoading(false);
    });

    wavesurfer.current.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.current.getDuration());
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className="flex items-center gap-3 min-w-[320px] sm:min-w-[520px] h-10 sm:h-12">
      {language && (
        <div className="flex items-center h-full pr-3 border-r border-white/20 mr-1">
          <span className="text-[14px] font-mono font-bold uppercase tracking-widest text-white/90">
              {language}
          </span>
        </div>
      )}

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      
      <div className="flex-1 relative h-[32px] flex items-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-white/80" size={20} />
          </div>
        )}

        <div 
          ref={containerRef} 
          className={clsx(
            "w-full transition-opacity duration-500", 
            isLoading ? "opacity-0" : "opacity-100"
          )} 
        />
      </div>
      
      <span className="text-xs font-mono text-white/90 w-[32px] text-right tabular-nums">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>

      <button 
        onClick={handleDownload}
        disabled={isDownloading || isLoading}
        className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-1"
        title="Download Audio"
      >
        {isDownloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
      </button>
    </div>
  );
};

export function MessageItem({
  message,
  onRegenerate,
  onExpand,
  viewMode = 'single',
  modelName = 'Random',
  isThinkingModel = false,
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

  const isThinkingModelRef = useRef(false);
  useEffect(() => {
    if (!isThinkingModelRef.current && message?.content?.trim().startsWith('<think>')) {
      isThinkingModelRef.current = true;
    }
  }, [message?.content]);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(contentRef?.current?.innerText);
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

  // Check if we should use diff highlighting
  const shouldUseDiffHighlighting = useMemo(() => {
    // Since we're in ASR components, we don't need to check session_type
    // Just verify we're in compare/random mode with two different texts
    const result = (
      session &&
      (session.mode === 'compare' || session.mode === 'random') &&
      viewMode === 'compare' &&
      otherModelContent &&
      message.content &&
      !message.isStreaming &&
      message.role === 'assistant'
    );
    
    return result;
  }, [session, viewMode, otherModelContent, message.content, message.isStreaming, message.role]);

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
          <div className="bg-orange-500 text-white px-3 py-2 rounded-lg max-w-2xl shadow-sm">
              <AudioMessageBubble audioUrl={message?.temp_audio_url} language={message?.language} />
          </div>
        </div>
      </div>
    );
  }

  const showFeedbackButtons = sessionMode === 'direct' && message.content;

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
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-2 text-gray-500">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy Message"
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
            !isThinkingModelRef.current && (!isThinkingModel ?
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" /> :
              <span className="text-xs text-gray-600 font-normal italic animate-pulse">
                Thinking...
              </span>
            )}

          {sections.map((sec, i) =>
            sec.type === 'think' ? (
              <ThinkBlock
                key={i}
                content={sec.content}
                isStreaming={sec.open}
              />
            ) : shouldUseDiffHighlighting ? (
              <DiffHighlighter
                key={i}
                text1={message.content}
                text2={otherModelContent}
                currentText={message.content}
              />
            ) : (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm]}
                components={{ code: CodeBlock, pre: ({ children }) => <>{children}</>, a: ({ node, ...props }) => (<a {...props} target="_blank" rel="noopener noreferrer" />), }}
              >
                {sec.content}
              </ReactMarkdown>
            )
          )}

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