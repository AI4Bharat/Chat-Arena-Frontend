import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { CompareView } from './CompareView';
import { ExpandedMessageView } from './ExpandedMessageView';
import { NewChatLanding } from './NewChatLanding';
import { BranchModal } from './BranchModal';
import { useState, useMemo } from 'react';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, selectBranch, branchSession, setActiveSession, fetchSessionById } from '../store/chatSlice';
import { useNavigate } from 'react-router-dom';

import { ServiceNavigationTile } from '../../../shared/components/ServiceNavigationTile';

export function ChatWindow({ isSidebarOpen = true }) {
  const dispatch = useDispatch();
  const { activeSession, messages, streamingMessages } = useSelector((state) => state.chat);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [branchMessage, setBranchMessage] = useState(null);
  const [isInputActive, setIsInputActive] = useState(false);

  const sessionMessages = messages[activeSession?.id] || [];
  const sessionStreamingMessages = streamingMessages[activeSession?.id] || {};

  // const isChatLocked = useMemo(() => {
  //   if (activeSession?.mode !== 'random' || sessionMessages.length === 0) {
  //     return false;
  //   }
  //   const lastUserMessage = [...sessionMessages].reverse().find(m => m.role === 'user');
  //   return !!lastUserMessage?.feedback;
  // }, [activeSession, sessionMessages]);

  const handleExpand = (message) => setExpandedMessage(message);
  const handleCloseExpand = () => setExpandedMessage(null);
  
  const handleBranch = (message) => setBranchMessage(message);
  const handleCloseBranch = () => setBranchMessage(null);
  const navigate = useNavigate();

  const { regenerateMessage, generateBranchResponse } = useStreamingMessage();
  
  const handleBranchCreated = async (message, newTitle) => {
    try {
      // Check if this is an assistant message (new session branching)
      if (message.role === 'assistant') {
        // Create a new session branched from this assistant message
        const loadingToast = toast.loading('Creating branched session...');
        
        const result = await dispatch(branchSession({
          sessionId: activeSession.id,
          assistantMessageId: message.id,
          newTitle: newTitle
        })).unwrap();
        
        // Fetch the full session with messages
        await dispatch(fetchSessionById(result.id)).unwrap();
        
        toast.success('Branched session created!', { id: loadingToast });
        
        // Navigate to the new session
        navigate(`/chat/${result.id}`);
        
        return result;
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to create branch');
      throw error;
    }
  };

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
            <NewChatLanding isInputActive={isInputActive} />
            <motion.div
              className="w-full flex flex-col items-center"
            >
              <MessageInput
                isCentered={true}
                isSidebarOpen={isSidebarOpen}
                onInputActivityChange={setIsInputActive}
              />
              <div className="mt-4 w-full flex justify-center">
                <ServiceNavigationTile isInputActive={isInputActive} session_mode="LLM"/>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
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
                  onBranch={handleBranch}
                  isSidebarOpen={isSidebarOpen}
                />
              )}
            </div>
            <motion.div
              className="w-full flex-shrink-0"
            >
              <MessageInput
                isCentered={false}
                sessionId={activeSession?.id}
                modelAId={activeSession?.model_a?.id}
                modelBId={activeSession?.model_b?.id}
                // isLocked={isChatLocked}
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
      
      {branchMessage && (
        <BranchModal
          message={branchMessage}
          onClose={handleCloseBranch}
          onBranchCreated={handleBranchCreated}
        />
      )}
    </>
  );
}