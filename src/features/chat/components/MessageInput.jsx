import { useState, useRef, useEffect } from 'react';
import { Send, LoaderCircle, Info, Image, Mic, Languages, X, AudioLines, FileText, Plus } from 'lucide-react';
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
import { IndicTransliterate } from "@ai4bharat/indic-transliterate-transcribe";
import { API_BASE_URL, apiClient } from '../../../shared/api/client';
import { TranslateIcon } from '../../../shared/icons/TranslateIcon';
import { LanguageSelector } from './LanguageSelector';
import { PrivacyNotice } from './PrivacyNotice';
import TextareaAutosize from 'react-textarea-autosize';
import { useTenant } from '../../../shared/context/TenantContext';

export function MessageInput({ sessionId, modelAId, modelBId, isCentered = false, isLocked = false, isSidebarOpen = true, onInputActivityChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;
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

  // Image upload states
  const imageInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState({ url: null, path: null });

  // Audio upload states
  const audioInputRef = useRef(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioName, setAudioName] = useState(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadedAudio, setUploadedAudio] = useState({ url: null, path: null });

  // Document upload states
  const docInputRef = useRef(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState({ url: null, path: null });

  // Unified Upload Menu State
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
        setIsUploadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [uploadMenuRef]);


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

  // Image handling functions
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    // Upload immediately after selection
    await uploadImageToBackend(file);

    // Reset file input
    e.target.value = '';
  };

  const uploadImageToBackend = async (file) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/messages/upload_image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.url) {
        throw new Error('No URL returned from server');
      }

      setUploadedImage({ url: response.data.url, path: response.data.path });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      removeImage();
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImage({ url: null, path: null });
  };

  // Audio handling functions
  const handleAudioSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a'];
    if (!validAudioTypes.includes(file.type)) {
      toast.error('Please select a valid audio file (mp3, wav, ogg, webm, m4a)');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Audio size must be less than 50MB');
      return;
    }

    setSelectedAudio(file);
    setAudioName(file.name);

    // Upload immediately after selection
    await uploadAudioToBackend(file);

    // Reset file input
    e.target.value = '';
  };

  const uploadAudioToBackend = async (file) => {
    setIsUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await apiClient.post('/messages/upload_audio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.url) {
        throw new Error('No URL returned from server');
      }

      setUploadedAudio({ url: response.data.url, path: response.data.path });
      toast.success('Audio uploaded successfully');
    } catch (error) {
      console.error('Audio upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload audio');
      removeAudio();
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const removeAudio = () => {
    setSelectedAudio(null);
    setAudioName(null);
    setUploadedAudio({ url: null, path: null });
  };

  // Document handling functions
  const handleDocumentSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validDocTypes.includes(file.type)) {
      toast.error('Please select a valid document (PDF, DOC, DOCX, TXT, MD, RTF, XLS, XLSX, CSV)');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Document size must be less than 20MB');
      return;
    }

    setSelectedDocument(file);
    setDocumentName(file.name);

    // Upload immediately after selection
    await uploadDocumentToBackend(file);

    // Reset file input
    e.target.value = '';
  };

  const uploadDocumentToBackend = async (file) => {
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await apiClient.post('/messages/upload_document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.url) {
        throw new Error('No URL returned from server');
      }

      setUploadedDocument({ url: response.data.url, path: response.data.path });
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload document');
      removeDocument();
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const removeDocument = () => {
    setSelectedDocument(null);
    setDocumentName(null);
    setUploadedDocument({ url: null, path: null });
  };


  const performActualSubmit = async (content) => {
    // Capture image, audio, and document URLs before clearing
    const imageUrl = uploadedImage.url;
    const imagePath = uploadedImage.path;
    const audioUrl = uploadedAudio.url;
    const audioPath = uploadedAudio.path;
    const docUrl = uploadedDocument.url;
    const docPath = uploadedDocument.path;


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
          type: 'LLM',
          tenant: currentTenant,
          metadata: {
            has_image: !!imagePath,
            has_audio: !!audioPath,
            has_document: !!docPath
          }
        })).unwrap();

        // Navigate with tenant prefix if available
        const navigatePath = currentTenant
          ? `/${currentTenant}/chat/${result.id}`
          : `/chat/${result.id}`;
        navigate(navigatePath, { replace: true });

        setInput('');
        removeImage();
        removeAudio();
        removeDocument();
        setIsStreaming(true);

        if (selectedMode === 'direct') {
          await streamMessage({ sessionId: result.id, content, modelId: result.model_a?.id, parent_message_ids: [], imageUrl, imagePath, audioUrl, audioPath, docUrl, docPath });
        } else {
          await streamMessageCompare({ sessionId: result.id, content, modelAId: result.model_a?.id, modelBId: result.model_b?.id, parentMessageIds: [], imageUrl, imagePath, audioUrl, audioPath, docUrl, docPath });
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
      removeImage();
      removeAudio();
      removeDocument();
      setIsStreaming(true);

      try {
        if (activeSession?.mode === 'direct') {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-1).map(msg => msg.id);
          await streamMessage({ sessionId, content, modelId: modelAId, parent_message_ids: parentMessageIds, imageUrl, imagePath, audioUrl, audioPath, docUrl, docPath });
        } else {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-2).map(msg => msg.id);
          await streamMessageCompare({ sessionId, content, modelAId, modelBId, parent_message_ids: parentMessageIds, imageUrl, imagePath, audioUrl, audioPath, docUrl, docPath });
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
    if (!input.trim() || isStreaming || isCreatingSession || isLocked) return;

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

  if (isLocked) {
    return (
      <div className={`w-full px-2 sm:px-4 ${isCentered ? 'pb-0' : 'pb-2 sm:pb-4'} bg-transparent`}>
        <div className={`${formMaxWidth}`}>
          <div className="flex items-center justify-center gap-2 text-center bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
            <Info size={16} className="flex-shrink-0" />
            Feedback submitted. Please start a new chat to continue.
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className={`w-full px-2 sm:px-4 ${isCentered ? 'pb-0' : 'pb-2 sm:pb-4'} bg-transparent`}>
        <form onSubmit={handleSubmit} className={`relative ${formMaxWidth}`}>
          <div className={`relative flex flex-col bg-white border-2 border-orange-500 rounded-xl shadow-sm w-full`}>
            {/* Image Preview */}
            {imagePreview && (
              <div className="px-3 pt-3">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="h-20 w-auto rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <LoaderCircle size={24} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Audio Preview */}
            {audioName && (
              <div className="px-3 pt-3">
                <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <AudioLines size={18} className="text-orange-600" />
                  <span className="text-sm text-gray-700 max-w-[200px] truncate">{audioName}</span>
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="ml-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    title="Remove audio"
                  >
                    <X size={14} />
                  </button>
                  {isUploadingAudio && (
                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                      <LoaderCircle size={20} className="text-orange-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Document Preview */}
            {documentName && (
              <div className="px-3 pt-3">
                <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText size={18} className="text-blue-600" />
                  <span className="text-sm text-gray-700 max-w-[200px] truncate">{documentName}</span>
                  <button
                    type="button"
                    onClick={removeDocument}
                    className="ml-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    title="Remove document"
                  >
                    <X size={14} />
                  </button>
                  {isUploadingDoc && (
                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                      <LoaderCircle size={20} className="text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  placeholder={isCentered ? 'Ask anything in your language...' : 'Ask followup...'}
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
                {/* Unified Upload Button */}
                <div className="relative" ref={uploadMenuRef}>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={handleAudioSelect}
                    accept="audio/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={handleDocumentSelect}
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf,.xls,.xlsx,.csv"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                    className={`p-1.5 sm:p-2 rounded-full transition-colors ${isUploadMenuOpen ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    aria-label="Add attachments"
                    title="Add attachments"
                  >
                    <Plus size={20} className="sm:w-5 sm:h-5" />
                  </button>

                  {/* Upload Menu */}
                  {isUploadMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={() => { imageInputRef.current?.click(); setIsUploadMenuOpen(false); }}
                          disabled={isUploadingImage}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                            {isUploadingImage ? <LoaderCircle size={16} className="animate-spin" /> : <Image size={16} />}
                          </div>
                          <span className="font-medium">Upload Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { docInputRef.current?.click(); setIsUploadMenuOpen(false); }}
                          disabled={isUploadingDoc}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                            {isUploadingDoc ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
                          </div>
                          <span className="font-medium">Upload Document</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { audioInputRef.current?.click(); setIsUploadMenuOpen(false); }}
                          disabled={isUploadingAudio}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
                            {isUploadingAudio ? <LoaderCircle size={16} className="animate-spin" /> : <AudioLines size={16} />}
                          </div>
                          <span className="font-medium">Upload Audio</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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