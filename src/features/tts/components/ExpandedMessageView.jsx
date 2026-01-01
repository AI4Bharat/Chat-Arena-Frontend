import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Bot, Copy, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { CodeBlock } from "./CodeBlock";
import { ThinkBlock } from "./ThinkBlock";
import { ProviderIcons } from '../../../shared/icons';
import { AudioMessageBubble } from './AudioMessageBubble';

export function ExpandedMessageView({ message, modelName, onClose }) {
  const contentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // const isThinkingModelRef = useRef(false);

  // useEffect(() => {
  //   if (!isThinkingModelRef.current && message?.content.trim().startsWith('<think>')) {
  //     isThinkingModelRef.current = true;
  //   }
  // }, [message?.content]);

  useEffect(() => {
    if (message?.isStreaming && contentRef.current) {
      const element = contentRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [message?.content, message?.isStreaming]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = (textToCopy) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // const sections = useMemo(() => {
  //   const text = message?.content || '';

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
  // }, [message?.content, message?.isStreaming]);

  const { IconComponent, isProviderIcon } = useMemo(() => {
    if (!modelName) {
      return { IconComponent: <Bot size={14} className="text-orange-500" />, isProviderIcon: false };
    }

    const firstWord = modelName.split(/[\s\-_]+/)[0].toLowerCase();
    const Icon = ProviderIcons[firstWord];

    if (Icon) {
      return { IconComponent: <Icon className="h-4 w-4" />, isProviderIcon: true };
    }

    return { IconComponent: <Bot size={14} className="text-orange-500" />, isProviderIcon: false };
  }, [modelName]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-40 flex items-center justify-center bg-gray-400/20 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="m-8 bg-white rounded-lg shadow-2xl w-full max-h-[calc(100%-4.3rem)] flex flex-col border border-gray-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full"
                >
                  {IconComponent}
                </div>
                <span className="font-medium text-sm text-gray-800">{modelName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(message?.temp_audio_url)}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Copy"
                  title="Copy Audio URL"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                {/* <button
                  onClick={() => toast.error('--')}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Regenerate"
                  title="Regenerate"
                >
                  <RefreshCw size={18} />
                </button> */}
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-sm max-w-4xl mx-auto text-justify">
                {message.isStreaming &&
                  (!message.content || message.content.trim().length === 0) &&
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" />
                  }

                {!message.isStreaming && message?.temp_audio_url &&
                  <div className=" text-gray-800 px-3 py-2 rounded-lg border border-gray-200">
                    <AudioMessageBubble audioUrl={message.temp_audio_url} language={message?.language} />
                  </div>
                }

                {message.isStreaming && message.content && (
                  <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 rounded-sm" />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}