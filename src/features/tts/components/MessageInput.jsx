import { useState, useRef, useEffect } from 'react';
import { Send, LoaderCircle, Info, Image, Mic, Languages } from 'lucide-react';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { useStreamingMessageCompare } from '../hooks/useStreamingMessagesCompare';
import { toast } from 'react-hot-toast';
import { useGuestLimitations } from '../hooks/useGuestLimitations';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';
import { AuthModal } from '../../auth/components/AuthModal';
import { PrivacyConsentModal } from './PrivacyConsentModal';
import { useSelector, useDispatch } from 'react-redux';
import { createSession, setSelectedLanguage, setIsTranslateEnabled, setMessageInputHeight } from '../store/chatSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../../shared/context/TenantContext';
import { IndicTransliterate } from "@ai4bharat/indic-transliterate-transcribe";
import { API_BASE_URL } from '../../../shared/api/client';
import { TranslateIcon } from '../../../shared/icons/TranslateIcon';
import { LanguageSelector } from './LanguageSelector';
import { PrivacyNotice } from './PrivacyNotice';
import TextareaAutosize from 'react-textarea-autosize';

export function MessageInput({ sessionId, modelAId, modelBId, isCentered = false, isSidebarOpen = true, onInputActivityChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;
  const { activeSession, messages, selectedMode, selectedModels, selectedLanguage, isTranslateEnabled } = useSelector((state) => state.chat);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const textareaRef = useRef(null);
  const { streamMessage } = useStreamingMessage();
  const { streamMessageCompare } = useStreamingMessageCompare();
  const { checkMessageLimit, showAuthPrompt, setShowAuthPrompt } = useGuestLimitations();
  const {
    hasGivenConsent,
    showConsentModal,
    checkConsentBeforeSending,
    handleAcceptConsent,
    handleDeclineConsent
  } = usePrivacyConsent();
  const micButtonRef = useRef(null);
  const [voiceState, setVoiceState] = useState('idle');

  // Notify parent about input activity (only if input has content)
  useEffect(() => {
    if (onInputActivityChange) {
      const isActive = input.trim().length > 0;
      onInputActivityChange(isActive);
    }
  }, [input, onInputActivityChange]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  // Auto-focus textarea on new chat (when there's no active session)
  useEffect(() => {
    if (!activeSession && isCentered) {
      // Longer delay to ensure navigation and component rendering is complete
      const focusTextarea = () => {
        // Try to focus using the ref first
        if (textareaRef.current) {
          textareaRef.current.focus();
          return;
        }

        // Fallback: find the textarea element directly
        const textarea = document.querySelector('textarea[placeholder*="Ask anything in your language..."]');
        if (textarea) {
          textarea.focus();
        }
      };

      setTimeout(focusTextarea, 300);
    }
  }, [activeSession, isCentered]);

  const performActualSubmit = async (content) => {
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
          type: 'TTS',
          tenant,
        })).unwrap();

        if (tenant) {
          navigate(`/${tenant}/tts/${result.id}`, { replace: true });
        } else {
          navigate(`/tts/${result.id}`, { replace: true });
        }

        setInput('');
        setIsStreaming(true);

        if (selectedMode === 'direct') {
          await streamMessage({ sessionId: result.id, content, modelId: result.model_a?.id, parent_message_ids: [], language: isTranslateEnabled ? selectedLanguage : "en" });
        } else {
          await streamMessageCompare({ sessionId: result.id, content, modelAId: result.model_a?.id, modelBId: result.model_b?.id, parentMessageIds: [], language: isTranslateEnabled ? selectedLanguage : "en" });
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
          await streamMessage({ sessionId, content, modelId: modelAId, parent_message_ids: parentMessageIds, language: isTranslateEnabled ? selectedLanguage : "en" });
        } else {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-2).map(msg => msg.id);
          await streamMessageCompare({ sessionId, content, modelAId, modelBId, parent_message_ids: parentMessageIds, language: isTranslateEnabled ? selectedLanguage : "en" });
        }
      } catch (error) {
        toast.error('Failed to send message');
      } finally {
        setIsStreaming(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || isCreatingSession) return;

    if (!checkMessageLimit()) {
      return;
    }

    const content = input.trim();

    // Check for privacy consent before sending message
    checkConsentBeforeSending(content, () => performActualSubmit(content));
  };

  const handleKeyDown = (e) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (e.key === 'Enter') {
      if (isMobile) {
        return;
      } else {
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      }
    }
  };

  const isLoading = isStreaming || isCreatingSession;

  const getFormMaxWidth = () => {
    if (isCentered) {
      return 'w-full max-w-3xl mx-auto';
    }
    const currentMode = activeSession?.mode ?? selectedMode ?? 'direct';
    const baseWidth = currentMode === 'direct' ? 'w-full max-w-3xl mx-auto' : 'w-full max-w-7xl mx-auto';
    if (!isSidebarOpen && window.innerWidth >= 768) {
      if (baseWidth === 'w-full max-w-3xl mx-auto') return 'w-full max-w-5xl mx-auto';
      if (baseWidth === 'w-full max-w-7xl mx-auto') return 'max-w-full mx-12';
    }
    return baseWidth;
  };

  const formMaxWidth = getFormMaxWidth();

  return (
    <>
      <div className={`w-full px-2 sm:px-4 ${isCentered ? 'pb-0' : 'pb-2 sm:pb-4'} bg-transparent`}>
        <form onSubmit={handleSubmit} className={`relative ${formMaxWidth}`}>
          <div className={`relative flex flex-col bg-white border-2 border-orange-500 rounded-xl shadow-sm w-full`}>
            <IndicTransliterate
              key={`indic-${selectedLanguage || 'default'}-${isTranslateEnabled}`}
              customApiURL={`${API_BASE_URL}/xlit-api/generic/transliteration/`}
              enableASR={true}
              asrApiUrl={`${API_BASE_URL}/asr-api/generic/transcribe`}
              // apiKey={`Bearer ${process.env.REACT_APP_XLIT_API_KEY}`}
              micButtonRef={micButtonRef}
              onVoiceTypingStateChange={setVoiceState}
              renderComponent={(props) => (
                <TextareaAutosize
                  ref={textareaRef}
                  placeholder='Type anything in your language...'
                  maxRows={isCentered ? 8 : 4}
                  onHeightChange={(height) => {
                    dispatch(setMessageInputHeight(height));
                  }}
                  className={`
                    w-full px-3 sm:px-4 pt-3 sm:pt-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none
                    text-gray-800 placeholder:text-gray-500 transition-colors duration-300 text-sm sm:text-base
                    [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
                    hover:[&::-webkit-scrollbar-thumb]:bg-gray-400
                  `}
                  {...props}
                />
              )}
              value={input}
              onChangeText={(text) => {
                setInput(text);
              }}
              onKeyDown={handleKeyDown}
              lang={isTranslateEnabled ? selectedLanguage : "en"}
              offsetY={-60}
              offsetX={0}
              horizontalView={true}
              enabled={isTranslateEnabled ? true : false}
              suggestionListClassName="
                absolute bottom-full mb-2 w-full left-0 p-2
                bg-white border border-orange-200 rounded-lg shadow-xl
                flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-1
              "
              suggestionItemClassName="
                px-3 py-2 rounded-md text-sm text-gray-700 w-full text-center sm:w-auto sm:text-left
                cursor-pointer hover:bg-orange-100 transition-colors
              "
              activeSuggestionItemClassName="
                px-3 py-2 rounded-md text-sm text-white bg-orange-500 w-full text-center sm:w-auto sm:text-left
                cursor-pointer transition-colors
              "
            />
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => dispatch(setIsTranslateEnabled(!isTranslateEnabled))}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors disabled:opacity-50 ${isTranslateEnabled ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-500 hover:bg-gray-100'}`}
                  aria-label="Toggle Transliteration"
                  title={isTranslateEnabled ? 'Switch to English' : 'Switch to Indian Languages'}
                >
                  {isTranslateEnabled ? <TranslateIcon className="h-5 w-5 sm:h-6 sm:w-6" fill='#f97316' /> : <TranslateIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>

                {isTranslateEnabled && (
                  <div className="flex items-center">
                    <div className="h-5 w-px bg-gray-300 mx-2" />
                    <LanguageSelector
                      value={selectedLanguage}
                      onChange={(e) => dispatch(setSelectedLanguage(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  ref={micButtonRef}
                  className={`p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-orange-600 transition-colors disabled:opacity-50`}
                  aria-label="Voice Typing"
                  title="Voice Typing"
                >
                  {voiceState === 'loading' ? (
                    <LoaderCircle size={18} className="text-orange-500 animate-spin sm:w-5 sm:h-5" />
                  ) : voiceState === 'recording' ? (
                    <div className="flex items-center justify-center gap-0.5 w-5 h-5">
                      <span className="inline-block w-0.5 h-3 bg-orange-500 rounded-full animate-sound-wave"></span>
                      <span className="inline-block w-0.5 h-4 bg-orange-500 rounded-full animate-sound-wave [animation-delay:100ms]"></span>
                      <span className="inline-block w-0.5 h-2 bg-orange-500 rounded-full animate-sound-wave [animation-delay:200ms]"></span>
                      <span className="inline-block w-0.5 h-3.5 bg-orange-500 rounded-full animate-sound-wave [animation-delay:300ms]"></span>
                      <span className="inline-block w-0.5 h-2.5 bg-orange-500 rounded-full animate-sound-wave [animation-delay:400ms]"></span>
                    </div>
                  ) : (
                    <Mic size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
                <button
                  type="submit"
                  aria-label="Send message"
                  title='Send Message'
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-colors
                    ${(!input.trim() || isLoading)
                      ? 'bg-transparent text-gray-500 hover:bg-gray-200 disabled:hover:bg-transparent'
                      : 'text-orange-500 hover:bg-gray-100'
                    }`
                  }
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <LoaderCircle size={18} className="animate-spin sm:w-5 sm:h-5" />
                  ) : (
                    <Send size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Privacy Notice - only show when input is centered (NewChat page) and user hasn't given consent */}
          {isCentered && !hasGivenConsent && input.trim().length > 0 && <PrivacyNotice />}
        </form>
      </div>

      <AuthModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} session_type="LLM" />

      {/* Privacy Consent Modal */}
      <PrivacyConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />
    </>
  );
}