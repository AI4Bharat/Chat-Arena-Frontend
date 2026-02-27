import { User, Bot, Copy, RefreshCw, Expand, Check, AlertTriangle, ThumbsUp, ThumbsDown, FileText, Volume2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { CodeBlock } from './CodeBlock';
import { ThinkBlock } from './ThinkBlock';
import { ProviderIcons } from '../../../shared/icons';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useDispatch } from 'react-redux';
import { updateMessageRating } from '../store/chatSlice';

function ImageSkeleton() {
  return (
    <div className="w-96 h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg shadow-lg animate-pulse relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer-gradient"></div>
      
      {/* Content placeholders */}
      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 bg-gray-400 rounded-full opacity-30"></div>
        <div className="w-24 h-3 bg-gray-400 rounded opacity-30"></div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer-gradient {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

function InlineErrorIndicator({ error, onRegenerate, canRegenerate }) {
  const [showDetails, setShowDetails] = useState(false);

  // Check if this is a ResponsibleAIPolicyViolation error
  const isPolicyViolation = error && (
    error.includes('ResponsibleAIPolicyViolation') ||
    error.includes('policy violation') ||
    error.includes('content policy')
  );

  // Use custom message for policy violations, otherwise use the error message
  const displayMessage = isPolicyViolation
    ? 'This prompt violates this AI Model\'s Policy. Please try again with a new prompt.'
    : 'This model landed into an issue.';

  return (
    <div className="not-prose mt-4 p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-sm font-semibold text-orange-900">Generation failed</p>
          <p className="text-sm text-orange-800 mt-1">{displayMessage}</p>

          {error && error !== 'An unexpected error occurred.' && !isPolicyViolation && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline font-medium"
            >
              {showDetails ? 'Hide details' : 'View details'}
            </button>
          )}

          {showDetails && error && !isPolicyViolation && (
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

function GeneratedImageDisplay({ imageUrl, partialUrl, progress, isGenerating }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayUrl = imageUrl || partialUrl;

  if (!displayUrl && !isGenerating) return null;

  return (
    <>
      <div className="not-prose mt-4 mb-4 relative group">
        {isGenerating && !displayUrl && (
          <div className="flex flex-col items-center justify-center gap-4">
            <ImageSkeleton />
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-purple-700">Generating image...</p>
              {progress && (
                <p className="text-xs text-purple-600 mt-1">{Math.round(progress * 100)}% complete</p>
              )}
            </div>
          </div>
        )}

        {displayUrl && (
          <div
            className="relative inline-block w-full max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto"
          >
            {!imageLoaded && isGenerating && (
              <div className="absolute inset-0 z-10">
                <ImageSkeleton />
              </div>
            )}
            {!imageLoaded && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
            <img
              src={displayUrl}
              alt="Generated image"
              className={clsx(
                "w-full h-auto max-h-[55vh] sm:max-h-[60vh] md:max-h-[65vh] object-contain rounded-lg shadow-lg transition-all duration-300",
                imageLoaded ? "opacity-100" : "opacity-0",
                isGenerating ? "animate-pulse border-2 border-purple-300" : "hover:shadow-xl"
              )}
              onLoad={() => setImageLoaded(true)}
            />
            {isGenerating && displayUrl === partialUrl && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full flex items-center gap-1 z-20">
                <Loader2 className="w-3 h-3 animate-spin" />
                Refining...
              </div>
            )}
            {/* click-to-expand removed */}
          </div>
        )}
      </div>
      {/* Expanded view removed - images no longer expand on click */}
    </>
  );
}

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
}) {
  const [copied, setCopied] = useState(false);
  const [copiedUserPrompt, setCopiedUserPrompt] = useState(false);

  const [localFeedback, setLocalFeedback] = useState(message.feedback || null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [partialImage, setPartialImage] = useState(null);
  const [imageProgress, setImageProgress] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const dispatch = useDispatch();
  const isUser = message.role === 'user';
  const contentRef = useRef(null);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const isThinkingModelRef = useRef(false);
  useEffect(() => {
    if (!isThinkingModelRef.current && message.content.trim().startsWith('<think>')) {
      isThinkingModelRef.current = true;
    }
  }, [message.content]);

  // Track generated images from message
  useEffect(() => {
    console.log('[MessageItem] Checking message for image fields:', {
      image_path: message.image_path,
      generated_image_url: message.generated_image_url,
      isGeneratingImage: message.isGeneratingImage,
      partialImageUrl: message.partialImageUrl
    });
    const makeFullUrl = (pathOrUrl) => {
      if (!pathOrUrl) return null;
      // If already an absolute URL, return as-is
      if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
      // Otherwise, prefix with backend base URL from env
      const base = (process.env.REACT_APP_API_URL || '').replace(/\/+$/,'');
      const p = String(pathOrUrl).replace(/^\/+/, '');
      return base ? `${base}/${p}` : `/${p}`;
    };

    if (message.image_path && !isUser) {
      const full = makeFullUrl(message.image_path);
      console.log('[MessageItem] Setting generatedImage from image_path:', message.image_path, '->', full);
      setGeneratedImage(full);
      setIsGeneratingImage(false);
    }
    if (message.generated_image_url && !isUser) {
      const full = makeFullUrl(message.generated_image_url);
      console.log('[MessageItem] Setting generatedImage from generated_image_url:', message.generated_image_url, '->', full);
      setGeneratedImage(full);
      setIsGeneratingImage(false);
    }
    // Some older backend versions store a placeholder in message.content like:
    // [Generated Image: generated-images/xxxxx.png]
    if (!message.image_path && !message.generated_image_url && message.content && !isUser) {
      const m = message.content.match(/\[Generated Image:\s*(.*?)\]/i);
      if (m && m[1]) {
        const full = makeFullUrl(m[1].trim());
        console.log('[MessageItem] Extracted generated image path from content:', m[1], '->', full);
        setGeneratedImage(full);
        setIsGeneratingImage(false);
      }
    }
    if (message.isGeneratingImage && !isUser) {
      setIsGeneratingImage(true);
    }
    if (message.partialImageUrl && !isUser) {
      setPartialImage(message.partialImageUrl);
    }
    if (message.imageProgress !== undefined && !isUser) {
      setImageProgress(message.imageProgress);
    }
  }, [message.image_path, message.generated_image_url, message.isGeneratingImage, message.partialImageUrl, message.imageProgress, isUser]);

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

  const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000); // 2 seconds like ChatGPT
  } catch (err) {
    console.error("Copy failed", err);
  }
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

    // Reset thinking state if content is empty (e.g. start of regeneration)
    if (!text.trim()) {
      isThinkingModelRef.current = false;
    }

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
<div className="group flex justify-end mb-4">
         <button
  onClick={handleCopy}
  className="
    mr-2
    opacity-0
    group-hover:opacity-100
    transition-opacity duration-200
    text-gray-400
    hover:text-gray-600
  "
>
 {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
</button>
        <div className="group flex items-start gap-3 justify-end">
          <div className="bg-orange-500 text-white px-3 py-2 rounded-lg max-w-2xl">
            {/* Display uploaded image if present */}
            {(message.temp_image_url || message.image_path) && (
              <div className="mb-2">
                <img
                  src={message.temp_image_url || message.image_path}
                  alt="Uploaded"
                  className="max-w-full h-auto rounded max-h-40 object-contain"
                />
              </div>
            )}
            {/* Display uploaded document if present */}
            {(message.temp_doc_url || message.doc_path) && (
              <div className="mb-2 p-2 bg-white/20 rounded-md flex items-center gap-2">
                <FileText size={20} className="text-white" />
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  Attached Document
                </span>
              </div>
            )}
            {/* Display uploaded audio if present */}
            {(message.temp_audio_url || message.audio_path) && (
              <div className="mb-2 p-2 bg-white/15 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={14} className="text-white/80" />
                  <span className="text-xs text-white/80">Audio</span>
                </div>
                <audio
                  controls
                  className="w-full h-8"
                  src={message.temp_audio_url || message.audio_path}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}
           <p className="whitespace-pre-wrap">{message.content}</p>
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
          {/* Display generated image if present */}
          {!isUser && (generatedImage || isGeneratingImage || partialImage) && (
            <GeneratedImageDisplay
              imageUrl={generatedImage}
              partialUrl={partialImage}
              progress={imageProgress}
              isGenerating={isGeneratingImage}
            />
          )}

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
