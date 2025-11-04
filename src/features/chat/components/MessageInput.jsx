import { useState, useRef, useEffect } from 'react';
import { Send, LoaderCircle, Info, Image, Mic, Languages } from 'lucide-react';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { useStreamingMessageCompare } from '../hooks/useStreamingMessagesCompare';
import { toast } from 'react-hot-toast';
import { useGuestLimitations } from '../hooks/useGuestLimitations';
import { AuthModal } from '../../auth/components/AuthModal';
import { useSelector, useDispatch } from 'react-redux';
import { createSession } from '../store/chatSlice';
import { useNavigate } from 'react-router-dom';
import { IndicTransliterate } from "@ai4bharat/indic-transliterate-transcribe";
import { API_BASE_URL } from '../../../shared/api/client';
import { TranslateIcon } from './icons/TranslateIcon';
import { LanguageSelector } from './LanguageSelector';
import TextareaAutosize from 'react-textarea-autosize';

export function MessageInput({ sessionId, modelAId, modelBId, isCentered = false, isLocked = false, isSidebarOpen = true }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeSession, messages, selectedMode, selectedModels } = useSelector((state) => state.chat);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const textareaRef = useRef(null);
  const { streamMessage } = useStreamingMessage();
  const { streamMessageCompare } = useStreamingMessageCompare();
  const { checkMessageLimit, showAuthPrompt, setShowAuthPrompt } = useGuestLimitations();
  const [isTranslateEnabled, setIsTranslateEnabled] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');
  const micButtonRef = useRef(null);
  const [voiceState, setVoiceState] = useState('idle');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || isCreatingSession || isLocked) return;

    if (!checkMessageLimit()) {
      return;
    }

    const content = input.trim();

    if (!activeSession) {
      if (!selectedMode ||
        (selectedMode === 'direct' && !selectedModels?.modelA) ||
        (selectedMode === 'compare' && (!selectedModels?.modelA || !selectedModels?.modelB))) {
        toast.error('Please select a model first');
        return;
      }

      setIsCreatingSession(true);
      try {
        const result = await dispatch(createSession({
          mode: selectedMode,
          modelA: selectedModels.modelA,
          modelB: selectedModels.modelB,
        })).unwrap();

        navigate(`/chat/${result.id}`, { replace: true });

        setInput('');
        setIsStreaming(true);

        if (selectedMode === 'direct') {
          await streamMessage({ sessionId: result.id, content, modelId: result.model_a?.id, parent_message_ids: [] });
        } else {
          await streamMessageCompare({ sessionId: result.id, content, modelAId: result.model_a?.id, modelBId: result.model_b?.id, parentMessageIds: [] });
        }
      } catch (error) {
        toast.error('Failed to create session');
        console.error('Session creation error:', error);
      } finally {
        setIsCreatingSession(false);
        setIsStreaming(false);
      }
    } else {
      setInput('');
      setIsStreaming(true);

      try {
        if (activeSession?.mode === 'direct') {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-1).map(msg => msg.id);
          await streamMessage({ sessionId, content, modelId: modelAId, parent_message_ids: parentMessageIds, });
        } else {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-2).map(msg => msg.id);
          await streamMessageCompare({ sessionId, content, modelAId, modelBId, parent_message_ids: parentMessageIds });
        }
      } catch (error) {
        toast.error('Failed to send message');
      } finally {
        setIsStreaming(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isLoading = isStreaming || isCreatingSession;

  // Adjust max width based on sidebar state and mode
  const getFormMaxWidth = () => {
    const baseWidth = isCentered ? 'max-w-3xl' : (activeSession ? activeSession?.mode === "direct" ? 'max-w-3xl' : 'max-w-7xl' : selectedMode === "direct" ? 'max-w-3xl' : 'max-w-7xl');
    
    // When sidebar is collapsed on desktop, allow more width
    if (!isSidebarOpen && window.innerWidth >= 768) {
      if (baseWidth === 'max-w-3xl') return 'max-w-4xl';
      if (baseWidth === 'max-w-7xl') return 'max-w-full';
    }
    return baseWidth;
  };

  const formMaxWidth = getFormMaxWidth();

  if (isLocked) {
    return (
      <div className={`w-full px-2 sm:px-4 ${isCentered ? 'pb-0' : 'pb-2 sm:pb-4'} bg-transparent`}>
        <div className={`${formMaxWidth} mx-auto`}>
          <div className="flex items-center justify-center gap-2 text-center bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
            <Info size={16} />
            Feedback submitted. Please start a new chat to continue.
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className={`w-full ${isCentered ? 'pb-0' : 'pb-3 sm:pb-6'} bg-transparent px-4 sm:px-6`}>
        <form onSubmit={handleSubmit} className={`${formMaxWidth} w-full mx-auto`}>
          {/* Sarvam-inspired warm, minimal container with soft shadow */}
          <div
            className="relative flex flex-col bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700/50 rounded-[20px] box-border shadow-[0_4px_16px_rgba(230,126,34,0.08)] dark:shadow-[0_4px_16px_rgba(230,126,34,0.15)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(230,126,34,0.12)] dark:hover:shadow-[0_6px_24px_rgba(230,126,34,0.2)] left-[-5px] right-[-1px] sm:left-[-7px] sm:right-auto"
          >
            <IndicTransliterate
              key={`indic-${selectedLang || 'default'}-${isTranslateEnabled}`}
              customApiURL={`${API_BASE_URL}/xlit-api/generic/transliteration/`}
              enableASR={isTranslateEnabled ? true : false}
              asrApiUrl={`${API_BASE_URL}/asr-api/generic/transcribe`}
              // apiKey={`Bearer ${process.env.REACT_APP_XLIT_API_KEY}`}
              micButtonRef={micButtonRef}
              onVoiceTypingStateChange={setVoiceState}
              renderComponent={(props) => (
                <TextareaAutosize
                  ref={textareaRef}
                  placeholder={isCentered ? 'Ask anything...' : 'Ask followup...'}
                  maxRows={isCentered ? 8 : 4}
                  className={`
                    w-full px-4 sm:px-5 pt-4 sm:pt-5 bg-transparent border-none focus:ring-0 focus:outline-none resize-none
                    text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 
                    transition-colors duration-300 text-base sm:text-[16px] leading-relaxed
                    [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-orange-200 dark:[&::-webkit-scrollbar-thumb]:bg-orange-700/50
                    hover:[&::-webkit-scrollbar-thumb]:bg-orange-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-orange-600/60
                  `}
                  {...props}
                />
              )}
              value={input}
              onChangeText={(text) => {
                setInput(text);
              }}
              onKeyDown={handleKeyDown}
              lang={selectedLang}
              offsetY={-60}
              offsetX={0}
              horizontalView={true}
              enabled={selectedLang !== null ? selectedLang === "en" ? false : isTranslateEnabled === false ? false : true : true}
              suggestionListClassName="
                absolute bottom-full mb-3 w-full left-0 p-3
                bg-white dark:bg-gray-800 border border-orange-200/50 dark:border-orange-700/50 rounded-2xl 
                shadow-[0_8px_24px_rgba(230,126,34,0.15)] dark:shadow-[0_8px_24px_rgba(230,126,34,0.25)]
                flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-1.5
              "
              suggestionItemClassName="
                px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 w-full text-center sm:w-auto sm:text-left
                cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200
              "
              activeSuggestionItemClassName="
                px-4 py-2.5 rounded-xl text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 
                w-full text-center sm:w-auto sm:text-left cursor-pointer transition-all duration-200 shadow-sm
              "
            />
            {/* Button container with refined spacing */}
            <div className="flex items-center justify-between px-3 pb-3 sm:px-4 sm:pb-4 pt-2">
              {/* Left side - Translation controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsTranslateEnabled(!isTranslateEnabled)}
                  className={`
                    p-2 sm:p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50
                    ${isTranslateEnabled 
                      ? 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                  disabled={isLoading}
                  aria-label="Toggle translation"
                >
                  {isTranslateEnabled ? <TranslateIcon className="h-5 w-5 sm:h-5 sm:w-5" fill='#EA580C' /> : <TranslateIcon className="h-5 w-5 sm:h-5 sm:w-5" />}
                </button>

                {isTranslateEnabled && (
                  <div className="flex items-center">
                    <div className="h-5 w-px bg-orange-200 dark:bg-orange-700/50 mx-1.5" />
                    <LanguageSelector
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-1">
                {/* Microphone button with enhanced styling */}
                <button
                  type="button"
                  ref={micButtonRef}
                  className={`
                    p-2 sm:p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50
                    ${voiceState === 'recording' 
                      ? 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-orange-600 dark:hover:text-orange-500'
                    }
                  `}
                  disabled={isLoading}
                  aria-label="Voice input"
                >
                  {voiceState === 'loading' ? (
                    <LoaderCircle size={20} className="text-orange-500 animate-spin" />
                  ) : voiceState === 'recording' ? (
                    <div className="flex items-center justify-center gap-0.5 w-5 h-5">
                      <span className="inline-block w-0.5 h-3 bg-orange-500 rounded-full animate-sound-wave"></span>
                      <span className="inline-block w-0.5 h-4 bg-orange-500 rounded-full animate-sound-wave [animation-delay:100ms]"></span>
                      <span className="inline-block w-0.5 h-2 bg-orange-500 rounded-full animate-sound-wave [animation-delay:200ms]"></span>
                      <span className="inline-block w-0.5 h-3.5 bg-orange-500 rounded-full animate-sound-wave [animation-delay:300ms]"></span>
                      <span className="inline-block w-0.5 h-2.5 bg-orange-500 rounded-full animate-sound-wave [animation-delay:400ms]"></span>
                    </div>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
                
                {/* Image upload button */}
                <button
                  type="button"
                  onClick={() => toast('Image upload coming soon!')}
                  className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-orange-600 dark:hover:text-orange-500 transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                  aria-label="Attach file"
                >
                  <Image size={20} />
                </button>
                
                {/* Send button with gradient on active state */}
                <button
                  type="submit"
                  aria-label="Send message"
                  className={`
                    w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200
                    ${(!input.trim() || isLoading)
                      ? 'bg-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:hover:bg-transparent disabled:cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm hover:shadow-md active:scale-95'
                    }
                  `}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <LoaderCircle size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <AuthModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />
    </>
  );
}