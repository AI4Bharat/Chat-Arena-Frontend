import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { CompareView } from './CompareView';
import { ExpandedMessageView } from './ExpandedMessageView';
import { NewChatLanding } from './NewChatLanding';
import { useState, useMemo, useRef } from 'react';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { toast } from 'react-hot-toast';

export function ChatWindow({ isSidebarOpen = true }) {
  const { activeSession, messages, streamingMessages } = useSelector((state) => state.chat);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const scrollContainerRef = useRef(null);

  const sessionMessages = messages[activeSession?.id] || [];
  const sessionStreamingMessages = streamingMessages[activeSession?.id] || {};

  // Handle scroll detection for "New Messages" button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isAtBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 50;
      console.log('🔍 ChatWindow Scroll Debug:', { 
        scrollHeight: el.scrollHeight, 
        clientHeight: el.clientHeight, 
        scrollTop: el.scrollTop,
        isAtBottom,
        isUserScrolledUp: !isAtBottom
      });
      setIsUserScrolledUp(!isAtBottom);
    }
  };

  const isChatLocked = useMemo(() => {
    if (activeSession?.mode !== 'random' || sessionMessages.length === 0) {
      return false;
    }
    const lastUserMessage = [...sessionMessages].reverse().find(m => m.role === 'user');
    return !!lastUserMessage?.feedback;
  }, [activeSession, sessionMessages]);

  const handleExpand = (message) => setExpandedMessage(message);
  const handleCloseExpand = () => setExpandedMessage(null);

  const { regenerateMessage } = useStreamingMessage();

  const handleRegenerate = async (message) => {
    if (!activeSession?.id || message.role !== 'assistant') {
      console.error('Invalid message for regeneration');
      return;
    }

    try {
      await regenerateMessage({
        sessionId: activeSession.id,
        messageToRegenerate: message,
      });

      toast.success('Regenerated response');
    } catch (error) {
      console.error('Failed to regenerate message:', error);
      toast.error('Failed to regenerate message');
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gray-50 relative">
        {!activeSession ? (
          <div className="h-full flex flex-col justify-center items-center">
            <NewChatLanding />
            <motion.div
              layoutId="message-input-wrapper"
              className="w-full"
            >
              <MessageInput isCentered={true} isSidebarOpen={isSidebarOpen} />
            </motion.div>
          </div>
        ) : (
          <>
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
            >
              {activeSession.mode === 'compare' || activeSession.mode === 'random' ? (
                <CompareView
                  session={activeSession}
                  messages={sessionMessages}
                  streamingMessages={sessionStreamingMessages}
                  onRegenerate={handleRegenerate}
                  isSidebarOpen={isSidebarOpen}
                />
              ) : (
                <MessageList
                  messages={sessionMessages}
                  streamingMessages={sessionStreamingMessages}
                  session={activeSession}
                  onExpand={handleExpand}
                  onRegenerate={handleRegenerate}
                  isSidebarOpen={isSidebarOpen}
                  isUserScrolledUp={isUserScrolledUp}
                  scrollContainerRef={scrollContainerRef}
                />
              )}
            </div>
            <motion.div
              layoutId="message-input-wrapper"
              className="w-full flex-shrink-0"
            >
              <MessageInput
                isCentered={false}
                sessionId={activeSession?.id}
                modelAId={activeSession?.model_a?.id}
                modelBId={activeSession?.model_b?.id}
                isLocked={isChatLocked}
                isSidebarOpen={isSidebarOpen}
              />
            </motion.div>
          </>
        )}
      </div>

      <ExpandedMessageView
        message={expandedMessage}
        modelName={activeSession?.model_a?.display_name}
        onClose={handleCloseExpand}
      />
    </>
  );
}