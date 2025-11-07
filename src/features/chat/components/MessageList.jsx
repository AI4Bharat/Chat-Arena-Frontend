import { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';

export function MessageList({ 
  messages, 
  streamingMessages, 
  session, 
  onExpand, 
  onRegenerate, 
  isSidebarOpen = true,
  isUserScrolledUp,
  scrollContainerRef
}) {
  const endOfMessagesRef = useRef(null);
  const { isRegenerating, selectedMode } = useSelector((state) => ({
    isRegenerating: state.chat.isRegenerating,
    selectedMode: state.chat.selectedMode,
  }));
  useEffect(() => {
    if (!isUserScrolledUp) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessages, isUserScrolledUp]);

  // Handle "↓ New Messages" button click
  const handleScrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // Note: We can't directly set isUserScrolledUp here since it's managed by parent
    // The scroll event will automatically update it when we reach bottom
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
    <div className="p-2 sm:p-4 relative">
      <div className={`${containerMaxWidth} mx-auto space-y-3 sm:space-y-4`}>
        {messages.map((message, idx) => (
          <MessageItem
            key={message.id}
            message={message}
            viewMode='single'
            modelName={session.model_a?.display_name}
            onExpand={onExpand}
            onRegenerate={onRegenerate}
            canRegenerate={!isRegenerating && idx === messages.length - 1} 
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

      {/* ↓ New Messages Button */}
      {isUserScrolledUp && (
        <button
          onClick={handleScrollToBottom}
          className="fixed bottom-24 right-6 z-[9999] flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Scroll to new messages"
        >
          <ChevronDown size={16} />
          <span className="text-sm hidden sm:inline">New messages</span>
        </button>
      )}
    </div>
  );
}