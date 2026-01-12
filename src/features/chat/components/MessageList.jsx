import { useEffect, useRef, useState, useMemo } from 'react';
import { MessageItem } from './MessageItem';
import { useSelector } from 'react-redux';
import { getVisibleBranchPath } from '../utils/branchUtils';

export function MessageList({ messages, streamingMessages, session, onExpand, onRegenerate, onBranch, isSidebarOpen = true }) {
  const endOfMessagesRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const { isRegenerating, selectedMode, branchSelections } = useSelector((state) => ({
    isRegenerating: state.chat.isRegenerating,
    selectedMode: state.chat.selectedMode,
    branchSelections: state.chat.branchSelections,
  }));
  
  // Get the current branch path based on selections
  const sessionBranchSelections = branchSelections[session?.id] || {};
  const visibleMessages = useMemo(() => {
    return getVisibleBranchPath(messages, sessionBranchSelections);
  }, [messages, sessionBranchSelections]);
  
  useEffect(() => {
    if (!isUserScrolledUp) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessages, isUserScrolledUp, visibleMessages]);

  const handleMainScroll = () => {
    const el = mainScrollRef.current;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
      setIsUserScrolledUp(!isAtBottom);
    }
  };
  
  // Adjust max width based on sidebar state
  const getContainerMaxWidth = () => {
  const baseWidth = 'max-w-3xl';
    
    // When sidebar is collapsed on desktop, allow more width
    if (!isSidebarOpen && window.innerWidth >= 768) {
      return 'max-w-5xl';
    }
    return baseWidth;
  };

  const containerMaxWidth = getContainerMaxWidth();

  return (
    <div
      ref={mainScrollRef}
      onScroll={handleMainScroll}
      className="flex-1 overflow-y-auto p-2 sm:p-4 relative max-h-full"
    >
      <div className={`${containerMaxWidth} mx-auto space-y-3 sm:space-y-4`}>
        {visibleMessages.map((message, idx) => (
          <MessageItem
            key={message.id}
            message={message}
            viewMode='single'
            modelName={session.model_a?.display_name}
            onExpand={onExpand}
            onRegenerate={onRegenerate}
            onBranch={session.mode === 'direct' ? onBranch : undefined}
            canRegenerate={!isRegenerating && idx === visibleMessages.length - 1} 
            sessionMode={session.mode}
            sessionId={session.id}
            branchInfo={message._siblings && message._siblings.length > 1 ? {
              siblings: message._siblings,
              currentIndex: message._siblingIndex,
              parentMessageId: message._parentId
            } : null}
          />
        ))}

        {Object.entries(streamingMessages).map(([messageId, streamingData]) => (
          <MessageItem
            key={messageId}
            message={{
              id: messageId,
              content: streamingData.content,
              role: 'assistant',
              isStreaming: true,
            }}
            viewMode='single'
            modelName={session.model_a?.display_name}
          />
        ))}

        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}