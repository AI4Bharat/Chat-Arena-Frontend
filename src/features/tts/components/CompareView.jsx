import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { toast } from 'react-hot-toast';
import { ConversationTurn } from './ConversationTurn';
import { FeedbackSelector } from './FeedbackSelector';
import { VotingGuideTooltip } from './VotingGuideTooltip';
import { ExpandedMessageView } from './ExpandedMessageView';
import { updateMessageFeedback, updateActiveSessionData } from '../store/chatSlice';
import { useDispatch } from 'react-redux';
import { useVotingGuide } from '../hooks/useVotingGuide';
import { nowIST } from '../utils/dateUtils';

export function CompareView({ session, messages, streamingMessages, onRegenerate, isSidebarOpen = true, onDetailedFeedbackStatusChange }) {
  const endOfMessagesRef = useRef(null);
  const [feedbackState, setFeedbackState] = useState({ turnId: null, selection: null });
  const feedbackStateRef = useRef({ turnId: null, selection: null });
  const [hoverPreview, setHoverPreview] = useState(null);
  const mainScrollRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [isSubmittingDetailedFeedback, setIsSubmittingDetailedFeedback] = useState(false);
  const [detailedFeedbackSubmitted, setDetailedFeedbackSubmitted] = useState(false);
  const [audioAListened, setAudioAListened] = useState(false);
  const [audioBListened, setAudioBListened] = useState(false);
  const [audioAEvents, setAudioAEvents] = useState([]);
  const [audioBEvents, setAudioBEvents] = useState([]);
  const promptDisplayedAtRef = useRef(null);
  const audioLinkAReceivedAtRef = useRef(null);
  const audioALoadedAtRef = useRef(null);
  const audioLinkBReceivedAtRef = useRef(null);
  const audioBLoadedAtRef = useRef(null);
  const preferenceSubmittedAtRef = useRef(null);
  const dispatch = useDispatch();
  const {
    showVotingGuide,
    checkAndShowVotingGuide,
    handleGotIt,
    handleClose
  } = useVotingGuide();

  useEffect(() => {
    feedbackStateRef.current = feedbackState;
  }, [feedbackState]);

  const lastUserMessage = useMemo(
    () => [...messages].reverse().find(msg => msg.role === 'user'),
    [messages]
  );

  useEffect(() => {
    const hasExistingDetailedFeedback = lastUserMessage?.has_detailed_feedback || false;
    setDetailedFeedbackSubmitted(hasExistingDetailedFeedback);
    // Reset audio listened state and tracking only when session or the actual turn changes,
    setAudioAListened(false);
    setAudioBListened(false);
    setAudioAEvents([]);
    setAudioBEvents([]);
    promptDisplayedAtRef.current = null;
    audioLinkAReceivedAtRef.current = null;
    audioALoadedAtRef.current = null;
    audioLinkBReceivedAtRef.current = null;
    audioBLoadedAtRef.current = null;
    preferenceSubmittedAtRef.current = null;
  }, [session?.id, lastUserMessage?.id]);

  const handleExpand = (message) => {
    setExpandedMessage(message);
  };

  const handleCloseExpand = () => {
    setExpandedMessage(null);
  };

  useEffect(() => {
    if (!isUserScrolledUp) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessages, isUserScrolledUp]);

  const handleMainScroll = () => {
    const el = mainScrollRef.current;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      setIsUserScrolledUp(!isAtBottom);
    }
  };

  const handlePreference = async (turnId, preference) => {
    setHoverPreview(null);
    setFeedbackState({ turnId, selection: preference });

    if (session?.mode === 'academic') {
      preferenceSubmittedAtRef.current = nowIST();
    }

    try {
      const response = await apiClient.post(endpoints.feedback.submit, {
        session_id: session.id,
        feedback_type: 'preference',
        message_id: turnId,
        preference: preference,
      });
      dispatch(updateMessageFeedback({ sessionId: session.id, messageId: turnId, feedback: preference }));
      if (response.data && response.data.session_update) {
        dispatch(updateActiveSessionData(response.data.session_update));
      }
      toast.success('Preference recorded!');
    } catch (error) {
      toast.error('Failed to submit preference.');
    }
  };

  const handleDetailedFeedbackSubmit = async (feedbackData, selectionTimestamps) => {
    // Find the last turn with feedback from messages (which comes from Redux)
    const lastTurnWithFeedback = conversationTurns.findLast(turn => turn.userMessage.feedback);

    if (!lastTurnWithFeedback) {
      toast.error('Unable to submit detailed feedback');
      return;
    }

    const turnId = lastTurnWithFeedback.userMessage.id;
    const preference = lastTurnWithFeedback.userMessage.feedback;

    setIsSubmittingDetailedFeedback(true);
    const isAcademicMode = session?.mode === 'academic';
    const detailedFeedbackSubmittedAt = isAcademicMode ? nowIST() : null;

    try {
      const response = await apiClient.post(endpoints.feedback.submit, {
        session_id: session.id,
        feedback_type: 'preference',
        message_id: turnId,
        preference: preference,
        additional_feedback_json: feedbackData,
        ...(isAcademicMode ? {
          tracking_data: {
            session_started_at: session?.created_at,
            prompt_displayed_at: promptDisplayedAtRef.current,
            audio_link_a_received_at: audioLinkAReceivedAtRef.current,
            audio_a_loaded_at: audioALoadedAtRef.current,
            audio_link_b_received_at: audioLinkBReceivedAtRef.current,
            audio_b_loaded_at: audioBLoadedAtRef.current,
            audio_a_events: audioAEvents,
            audio_b_events: audioBEvents,
            preference_submitted_at: preferenceSubmittedAtRef.current,
            detailed_feedback_selection_timestamps: selectionTimestamps,
            detailed_feedback_submitted_at: detailedFeedbackSubmittedAt,
          },
        } : {}),
      });

      if (response.status >= 200 && response.status < 300) {
        setDetailedFeedbackSubmitted(true);
        toast.success('Detailed feedback submitted successfully');
        if (response.data && response.data.session_update) {
          dispatch(updateActiveSessionData(response.data.session_update));
        }
        if (onDetailedFeedbackStatusChange) {
          onDetailedFeedbackStatusChange(true);
        }
      }
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
      toast.error('Failed to submit detailed feedback');
    } finally {
      setIsSubmittingDetailedFeedback(false);
    }
  };

  const conversationTurns = useMemo(() => {
    const turns = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        const userMessage = messages[i];
        const potentialResponse1 = messages[i + 1];
        const potentialResponse2 = messages[i + 2];
        let modelAMessage = null;
        let modelBMessage = null;

        if (potentialResponse1 && potentialResponse1.role === 'assistant') {
          if (potentialResponse1.participant === 'a') modelAMessage = potentialResponse1;
          else modelBMessage = potentialResponse1;
        }
        if (potentialResponse2 && potentialResponse2.role === 'assistant') {
          if (potentialResponse2.participant === 'a') modelAMessage = potentialResponse2;
          else modelBMessage = potentialResponse2;
        }
        turns.push({ userMessage, modelAMessage, modelBMessage });
        i += 2;
      }
    }

    const streamingValues = Object.values(streamingMessages);
    if (streamingValues.length > 0) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn) {
        const streamA = streamingValues.find(m => m.participant === 'a');
        const streamB = streamingValues.find(m => m.participant === 'b');
        if (streamA) lastTurn.modelAMessage = { ...streamA, isStreaming: true };
        if (streamB) lastTurn.modelBMessage = { ...streamB, isStreaming: true };
      }
    }
    return turns;
  }, [messages, streamingMessages]);

  const handleAudioAPlayed = useCallback(() => setAudioAListened(true), []);
  const handleAudioBPlayed = useCallback(() => setAudioBListened(true), []);

  const handlePromptLoaded = useCallback((ts) => { promptDisplayedAtRef.current = ts; }, []);
  const handleAudioALoaded = useCallback((ts) => { audioALoadedAtRef.current = ts; }, []);
  const handleAudioBLoaded = useCallback((ts) => { audioBLoadedAtRef.current = ts; }, []);

  const deduplicatedAudioEvent = (prev, eventObj) => {
    const eventTime = new Date(eventObj.timestamp).getTime();
    const isDuplicate = prev.slice(-4).some(
      e => e.event === eventObj.event && Math.abs(new Date(e.timestamp).getTime() - eventTime) < 50
    );
    return isDuplicate ? prev : [...prev, eventObj];
  };

  const handleAudioAEvent = useCallback((eventObj) => {
    setAudioAEvents(prev => deduplicatedAudioEvent(prev, eventObj));
  }, []);
  const handleAudioBEvent = useCallback((eventObj) => {
    setAudioBEvents(prev => deduplicatedAudioEvent(prev, eventObj));
  }, []);

  const lastTurn = conversationTurns.length > 0 ? conversationTurns[conversationTurns.length - 1] : null;

  const lastTurnModelAUrl = lastTurn?.modelAMessage?.temp_audio_url;
  const lastTurnModelBUrl = lastTurn?.modelBMessage?.temp_audio_url;
  useEffect(() => {
    if (lastTurnModelAUrl && !audioLinkAReceivedAtRef.current) {
      audioLinkAReceivedAtRef.current = nowIST();
    }
  }, [lastTurnModelAUrl]);
  useEffect(() => {
    if (lastTurnModelBUrl && !audioLinkBReceivedAtRef.current) {
      audioLinkBReceivedAtRef.current = nowIST();
    }
  }, [lastTurnModelBUrl]);

  const isAcademic = session?.mode === 'academic';
  const bothAudiosListened = audioAListened && audioBListened;

  const showFeedbackControls =
    lastTurn &&
    lastTurn.modelAMessage &&
    lastTurn.modelBMessage &&
    lastTurn.modelAMessage.temp_audio_url &&
    lastTurn.modelBMessage.temp_audio_url &&
    !lastTurn.modelAMessage.isStreaming &&
    !lastTurn.modelBMessage.isStreaming &&
    !lastTurn.userMessage.feedback &&
    (!isAcademic || bothAudiosListened);

  // Show voting guide when feedback controls first appear (for first-time users)
  useEffect(() => {
    if (showFeedbackControls) {
      checkAndShowVotingGuide();
    }
  }, [showFeedbackControls, checkAndShowVotingGuide]);

  let messageDataForModal = expandedMessage;
  let modelNameForModal = '';

  if (expandedMessage) {
    const streamingData = Object.values(streamingMessages).find(
      (msg) => msg.id === expandedMessage.id
    );
    if (streamingData) {
      messageDataForModal = { ...expandedMessage, ...streamingData, isStreaming: true };
    }

    const participant = expandedMessage.participant;
    const isModelA = participant === 'a';

    modelNameForModal = isModelA ? session.model_a?.display_name : session.model_b?.display_name;
  }

  return (
    <>
      <ExpandedMessageView
        message={messageDataForModal}
        modelName={modelNameForModal}
        onClose={handleCloseExpand}
      />

      <div ref={mainScrollRef} onScroll={handleMainScroll} className="flex-1 overflow-y-auto p-2 sm:p-4 scroll-gutter-stable">
        <div className={`${(!isSidebarOpen && window.innerWidth >= 768) ? 'max-w-full mx-12' : 'max-w-7xl mx-auto'} space-y-3 sm:space-y-5 pb-6`}>
          {conversationTurns.map((turn, idx) => {
            const turnFeedback = turn.userMessage.feedback;
            const isLastTurn = idx === conversationTurns.length - 1;
            return (
              <ConversationTurn
                key={turn.userMessage?.id}
                turn={turn}
                modelAName={session.model_a?.display_name}
                modelBName={session.model_b?.display_name}
                feedbackSelection={turnFeedback}
                hoverPreview={isLastTurn ? hoverPreview : null}
                onHoverPreview={setHoverPreview}
                onExpand={handleExpand}
                onRegenerate={onRegenerate}
                isLastTurn={isLastTurn}
                session={session}
                onDetailedFeedbackSubmit={handleDetailedFeedbackSubmit}
                isSubmittingDetailedFeedback={isSubmittingDetailedFeedback}
                detailedFeedbackSubmitted={detailedFeedbackSubmitted}
                onAudioAPlayed={isLastTurn ? handleAudioAPlayed : undefined}
                onAudioBPlayed={isLastTurn ? handleAudioBPlayed : undefined}
                onAudioAEvent={isLastTurn && isAcademic ? handleAudioAEvent : undefined}
                onAudioBEvent={isLastTurn && isAcademic ? handleAudioBEvent : undefined}
                onAudioALoaded={isLastTurn && isAcademic ? handleAudioALoaded : undefined}
                onAudioBLoaded={isLastTurn && isAcademic ? handleAudioBLoaded : undefined}
                onPromptLoaded={isLastTurn && isAcademic ? handlePromptLoaded : undefined}
              />
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {showFeedbackControls && (
        <FeedbackSelector
          onSelect={(preference) => handlePreference(lastTurn.userMessage.id, preference)}
          onHover={setHoverPreview}
        />
      )}

      {/* Voting Guide Tooltip */}
      <VotingGuideTooltip
        isOpen={showVotingGuide}
        onClose={handleClose}
        onGotIt={handleGotIt}
      />
    </>
  );
}