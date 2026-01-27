import { useState, useRef, useEffect } from 'react';
import { Send, LoaderCircle, Mic, Upload, X, Check, Play, Pause, Trash2, RefreshCw } from 'lucide-react';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { useStreamingMessageCompare } from '../hooks/useStreamingMessagesCompare';
import { toast } from 'react-hot-toast';
import { useGuestLimitations } from '../hooks/useGuestLimitations';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';
import { AuthModal } from '../../auth/components/AuthModal';
import { PrivacyConsentModal } from './PrivacyConsentModal';
import { useSelector, useDispatch } from 'react-redux';
import { createSession, setSelectedLanguage } from '../store/chatSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import { LanguageSelector } from './LanguageSelector';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import { useTenant } from '../../../shared/context/TenantContext';

export const LiveAudioVisualizer = ({ recordingState, onRecordComplete, onRecordStart }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const recordPluginRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#f97316",
      progressColor: "#ea580c",
      height: 40,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      interact: false,
      responsive: true,
    });

    recordPluginRef.current = wavesurferRef.current.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        continuousWaveform: false,
        renderRecordedAudio: false,
      })
    );

    recordPluginRef.current.on("record-start", () => {
      if (onRecordStart) onRecordStart();
    });

    recordPluginRef.current.on("record-end", (blob) => {
      if (onRecordComplete) onRecordComplete(blob);
    });

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!recordPluginRef.current) return;
    if (recordingState === "recording") {
      recordPluginRef.current.startRecording();
    }
    if (recordingState === "idle") {
      recordPluginRef.current.stopRecording();
      wavesurferRef.current?.empty();
    }
  }, [recordingState]);

  return (
    <div ref={containerRef} className="w-full h-10 overflow-hidden" />
  );
};

const MAX_AUDIO_DURATION_SEC = 30;

export function MessageInput({
  sessionId,
  modelAId,
  modelBId,
  isCentered = false,
  isSidebarOpen = true,
  onInputActivityChange
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;

  const { messages, activeSession, selectedMode, selectedModels, selectedLanguage } = useSelector((state) => state.asrChat);

  const [recordingState, setRecordingState] = useState('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState('0:00');

  const fileInputRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferObj = useRef(null);
  const recordingTimerRef = useRef(null);

  const [audioBlob, setAudioBlob] = useState(null);

  const { streamMessage } = useStreamingMessage();
  const { streamMessageCompare } = useStreamingMessageCompare();
  const { checkMessageLimit, showAuthPrompt, setShowAuthPrompt } = useGuestLimitations();
  const { showConsentModal, checkConsentBeforeSending, handleAcceptConsent, handleDeclineConsent } = usePrivacyConsent();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploadedAudio, setUploadedAudio] = useState({ url: null, path: null });
  const isCancellingRef = useRef(false);

  // Notify parent about input activity (recording or reviewing audio)
  useEffect(() => {
    if (onInputActivityChange) {
      const isActive = recordingState !== 'idle' || audioBlob !== null;
      onInputActivityChange(isActive);
    }
  }, [recordingState, audioBlob, onInputActivityChange]);

  useEffect(() => {
    if (recordingState === 'recording' && isRecordingActive) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const nextTick = prev + 1;
          if (nextTick >= MAX_AUDIO_DURATION_SEC) {
            stopRecording();
            return MAX_AUDIO_DURATION_SEC;
          }
          return nextTick;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [recordingState, isRecordingActive]);

  useEffect(() => {
    if (recordingState === 'review' && audioBlob && waveformRef.current) {
      if (wavesurferObj.current) wavesurferObj.current.destroy();

      const url = URL.createObjectURL(audioBlob);

      wavesurferObj.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#d1d5db',
        progressColor: '#f97316',
        cursorColor: '#f97316',
        barWidth: 3,
        barGap: 3,
        barRadius: 3,
        height: 32,
        normalize: true,
      });

      wavesurferObj.current.load(url);

      wavesurferObj.current.on('ready', () => {
        const totalSeconds = wavesurferObj.current.getDuration();
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        setAudioDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      });

      wavesurferObj.current.on('finish', () => setIsPlaying(false));
      wavesurferObj.current.on('play', () => setIsPlaying(true));
      wavesurferObj.current.on('pause', () => setIsPlaying(false));
    }
  }, [recordingState, audioBlob]);

  const startRecording = () => {
    if (!checkMessageLimit()) return;
    setIsRecordingActive(false);
    setRecordingState("recording");
  };

  const stopRecording = () => {
    setIsRecordingActive(false);
    setRecordingState("idle");
  };

  const cancelRecording = () => {
    isCancellingRef.current = true;
    setIsRecordingActive(false);
    setRecordingState("idle");
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const discardAudio = () => {
    setAudioBlob(null);
    setUploadedAudio({ url: null, path: null });
    setIsUploading(false);
    setUploadError(false);
    setRecordingState('idle');
    setIsPlaying(false);
    setRecordingDuration(0);
    if (wavesurferObj.current) {
      wavesurferObj.current.destroy();
      wavesurferObj.current = null;
    }
  };

  const validateAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        if (audio.duration > MAX_AUDIO_DURATION_SEC) {
          reject(new Error(`Audio must be under ${MAX_AUDIO_DURATION_SEC} seconds`));
        } else {
          resolve(true);
        }
      };
      audio.onerror = () => {
        reject(new Error("Invalid audio file"));
      };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select a valid audio file.");
        return;
      }

      try {
        await validateAudioDuration(file);

        setAudioBlob(file);
        setRecordingState('review');
        uploadAudioToBackend(file);
      } catch (error) {
        toast.error(error.message || "Failed to validate audio");
        e.target.value = '';
      }
    }
    e.target.value = '';
  };

  const uploadAudioToBackend = async (blobOrFile) => {
    setIsUploading(true);
    setUploadError(false);
    setUploadedAudio({ url: null, path: null });
    try {
      const formData = new FormData();
      const fileName = blobOrFile.name || `mic-recording-${Date.now()}.webm`;
      formData.append('audio', blobOrFile, fileName);

      const response = await apiClient.post('/messages/upload_audio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (!data.url) throw new Error('No URL returned from server');
      setUploadedAudio({ url: data.url, path: data.path });

    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(true);
      toast.error("Failed to upload audio to storage");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryUpload = (e) => {
    e.preventDefault();
    if (audioBlob) {
      uploadAudioToBackend(audioBlob);
    }
  };

  const togglePlayback = (e) => {
    e.preventDefault();
    if (wavesurferObj.current) {
      wavesurferObj.current.playPause();
    }
  };

  const performActualSubmit = async () => {
    if (!audioBlob) return;

    const finalUrl = uploadedAudio.url;
    const finalPath = uploadedAudio.path;
    const finalLanguage = selectedLanguage;

    if (!finalUrl) {
      toast.error("Audio not fully uploaded yet");
      return;
    }

    discardAudio();

    if (!activeSession) {
      if (!selectedMode || (selectedMode === 'direct' && !selectedModels?.modelA)) {
        toast.error('Please select a model first');
        return;
      }

      setIsCreatingSession(true);
      try {
        const result = await dispatch(createSession({
          mode: selectedMode,
          modelA: selectedModels.modelA,
          modelB: selectedModels.modelB,
          type: 'ASR',
          tenant: currentTenant,
        })).unwrap();

        // Navigate with tenant prefix if available
        const navigatePath = currentTenant
          ? `/${currentTenant}/asr/${result.id}`
          : `/asr/${result.id}`;
        navigate(navigatePath, { replace: true });
        setIsSending(true);

        if (selectedMode === 'direct') {
          await streamMessage({ sessionId: result.id, url: finalUrl, modelId: result.model_a?.id, parent_message_ids: [], path: finalPath, language: finalLanguage, });
        } else {
          await streamMessageCompare({ sessionId: result.id, url: finalUrl, modelAId: result.model_a?.id, modelBId: result.model_b?.id, parentMessageIds: [], path: finalPath, language: finalLanguage, });
        }
      } catch (error) {
        toast.error('Failed to create session');
      } finally {
        setIsCreatingSession(false);
        setIsSending(false);
        discardAudio();
      }
    } else {
      setIsSending(true);
      try {
        if (activeSession?.mode === 'direct') {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-1).map(msg => msg.id);
          await streamMessage({ sessionId, url: finalUrl, modelId: modelAId, parent_message_ids: parentMessageIds, path: finalPath, language: finalLanguage, });
        } else {
          const parentMessageIds = messages[activeSession.id].filter(msg => msg.role === 'assistant').slice(-2).map(msg => msg.id);
          await streamMessageCompare({ sessionId, url: finalUrl, modelAId, modelBId, parent_message_ids: parentMessageIds, path: finalPath, language: finalLanguage, });
        }
      } catch (error) {
        toast.error('Failed to send audio');
      } finally {
        setIsSending(false);
        discardAudio();
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!audioBlob || isSending || isCreatingSession) return;
    checkConsentBeforeSending("Audio Message", () => performActualSubmit());
  };

  const getFormMaxWidth = () => {
    if (isCentered) return 'w-full max-w-3xl mx-auto';
    const currentMode = activeSession?.mode ?? selectedMode ?? 'direct';
    const baseWidth = currentMode === 'direct' ? 'w-full max-w-3xl mx-auto' : 'w-full max-w-7xl mx-auto';
    if (!isSidebarOpen && window.innerWidth >= 768) {
      if (baseWidth === 'w-full max-w-3xl mx-auto') return 'w-full max-w-5xl mx-auto';
      if (baseWidth === 'w-full max-w-7xl mx-auto') return 'max-w-full mx-12';
    }
    return baseWidth;
  };

  const isLoading = isSending || isCreatingSession;
  const formMaxWidth = getFormMaxWidth();

  const formatRecordingTime = (seconds) => {
    return `0:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      <div className={`w-full px-2 sm:px-4 ${isCentered ? 'pb-0' : 'pb-2 sm:pb-4'} bg-transparent`}>
        <div className={`relative ${formMaxWidth}`}>

          <div className="relative flex items-center bg-white border-2 border-orange-500 rounded-xl shadow-sm w-full h-[60px] transition-all" data-tour="asr-message-input">

            {recordingState === 'idle' && (
              <div className="pl-3">
                <LanguageSelector
                  value={selectedLanguage}
                  onChange={(e) => dispatch(setSelectedLanguage(e.target.value))}
                />
              </div>
            )}

            <div className="flex-1 min-w-0 h-full flex items-center px-4">

              {recordingState === 'idle' && <div className="flex-1" />}

              {recordingState === "recording" && (
                <div className="w-full h-full flex items-center gap-3 animate-in fade-in duration-200">
                  <div
                    className={`font-mono text-sm font-semibold w-10 text-center flex-shrink-0 transition-colors duration-300
                      ${!isRecordingActive ? 'opacity-50' : 'opacity-100'} 
                      ${recordingDuration > 25 ? 'text-red-500 animate-pulse' : 'text-gray-700'}
                    `}
                  >
                    {formatRecordingTime(recordingDuration)}
                  </div>

                  <div className="flex-1 h-full flex items-center overflow-hidden">
                    <LiveAudioVisualizer
                      recordingState={recordingState}
                      onRecordStart={() => setIsRecordingActive(true)}
                      onRecordComplete={(blob) => {
                        if (isCancellingRef.current) {
                          isCancellingRef.current = false;
                          return;
                        }
                        setAudioBlob(blob);
                        setRecordingState("review");
                        uploadAudioToBackend(blob);
                      }}
                    />
                  </div>
                </div>
              )}

              {recordingState === 'review' && (
                <div className="w-full flex items-center gap-3 animate-in fade-in duration-300">
                  <button
                    onClick={togglePlayback}
                    className="flex-shrink-0 p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-orange-600 transition-colors"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div ref={waveformRef} className="flex-1" />

                  <span className="text-xs text-gray-500 font-mono w-[36px] text-right">
                    {audioDuration}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center pr-3 gap-2">

              {recordingState === 'idle' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-orange-600 transition-colors"
                    title="Upload Audio File (Max 30s)"
                  >
                    <Upload size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isLoading}
                    className="p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-orange-600 transition-colors"
                    title="Start Recording"
                  >
                    <Mic size={20} />
                  </button>

                  <button
                    type="button"
                    disabled={true}
                    className="p-1.5 sm:p-2 text-gray-500"
                    title="Record or Upload audio to send"
                  >
                    <Send size={20} />
                  </button>
                </>
              )}

              {recordingState === 'recording' && (
                <>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className={`p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-red-500 transition-colors`}
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className={`p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-green-500 transition-colors`}
                    title="Finish"
                  >
                    <Check size={20} />
                  </button>
                </>
              )}

              {recordingState === 'review' && (
                <>
                  <button
                    type="button"
                    onClick={discardAudio}
                    disabled={isLoading}
                    className={`p-1.5 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-red-600 transition-colors`}
                    title="Discard"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={uploadError ? handleRetryUpload : handleSubmit}
                    disabled={isLoading || (isUploading && !uploadError)}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors hover:bg-gray-100
                              ${uploadError
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-orange-500 hover:text-orange-600'
                      }
                              ${(isLoading || isUploading) ? 'opacity-50 cursor-wait' : ''}
                          `}
                    title={
                      uploadError ? "Upload failed. Click to retry." :
                        isUploading ? "Uploading audio..." :
                          "Send Audio"
                    }
                  >
                    {isLoading || isUploading ? (
                      <LoaderCircle size={20} className="animate-spin" />
                    ) : uploadError ? (
                      <RefreshCw size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} session_type="ASR" />
      <PrivacyConsentModal isOpen={showConsentModal} onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />
    </>
  );
}