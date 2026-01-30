import { useEffect, useState, useRef, useMemo } from 'react';
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

export function CompareView({ session, messages, streamingMessages, onRegenerate, isSidebarOpen = true }) {
  const endOfMessagesRef = useRef(null);
  const [feedbackState, setFeedbackState] = useState({ turnId: null, selection: null });
  const [hoverPreview, setHoverPreview] = useState(null);
  const mainScrollRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const dispatch = useDispatch();
  const { 
    showVotingGuide, 
    checkAndShowVotingGuide, 
    handleGotIt, 
    handleClose
  } = useVotingGuide();

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

  const lastTurn = conversationTurns.length > 0 ? conversationTurns[conversationTurns.length - 1] : null;

  const showFeedbackControls =
    lastTurn &&
    lastTurn.modelAMessage &&
    lastTurn.modelBMessage &&
    lastTurn.modelAMessage.content &&
    lastTurn.modelBMessage.content &&
    !lastTurn.modelAMessage.isStreaming &&
    !lastTurn.modelBMessage.isStreaming &&
    !lastTurn.userMessage.feedback;

  // Show voting guide when feedback controls first appear (for first-time users)
  useEffect(() => {
    if (showFeedbackControls) {
      checkAndShowVotingGuide();
    }
  }, [showFeedbackControls, checkAndShowVotingGuide]);

  let messageDataForModal = expandedMessage;
  let modelNameForModal = '';

  if (expandedMessage) {
    const parentTurn = conversationTurns.find(
      (turn) =>
        turn.modelAMessage?.id === expandedMessage.id ||
        turn.modelBMessage?.id === expandedMessage.id
    );
    const hasFeedbackForThisTurn = !!parentTurn?.userMessage.feedback;

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

      <div ref={mainScrollRef} onScroll={handleMainScroll} className="flex-1 overflow-y-auto p-2 sm:p-4 max-h-full">
        <div className={`${(!isSidebarOpen && window.innerWidth >= 768) ? 'max-w-full mx-12' : 'max-w-7xl mx-auto'} space-y-3 sm:space-y-5 pb-6`}>
          {conversationTurns.map((turn, idx) => {
            // If turn has feedback, use it; otherwise find next turn with feedback
            let turnFeedback = turn.userMessage.feedback;
            if (!turnFeedback) {
              for (let j = idx + 1; j < conversationTurns.length; j++) {
                if (conversationTurns[j].userMessage.feedback) {
                  turnFeedback = conversationTurns[j].userMessage.feedback;
                  break;
                }
              }
            }
            return (
              <ConversationTurn
                key={turn.userMessage?.id}
                turn={turn}
                modelAName={session.model_a?.display_name}
                modelBName={session.model_b?.display_name}
                isThinkingModelA={session.model_a?.is_thinking_model}
                isThinkingModelB={session.model_b?.is_thinking_model}
                feedbackSelection={turnFeedback}
                hoverPreview={hoverPreview}
                onHoverPreview={setHoverPreview}
                onExpand={handleExpand}
                onRegenerate={onRegenerate}
                isLastTurn={idx === conversationTurns.length - 1}
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