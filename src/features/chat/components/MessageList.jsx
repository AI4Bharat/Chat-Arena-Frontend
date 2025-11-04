import { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { useSelector } from 'react-redux';

export function MessageList({ messages, streamingMessages, session, onExpand, onRegenerate, isSidebarOpen = true }) {
  const endOfMessagesRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isRegenerating = useSelector((state) => state.chat.isRegenerating);
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

  const lastAssistantMessageId = [...messages].reverse().find(msg => msg.role === 'assistant')?.id;
  
  // Adjust max width based on sidebar state
  const getContainerMaxWidth = () => {
    const baseWidth = session?.mode === 'direct' ? 'max-w-3xl' : 'max-w-7xl';
    
    // When sidebar is collapsed on desktop, allow more width
    if (!isSidebarOpen && window.innerWidth >= 768) {
      if (baseWidth === 'max-w-3xl') return 'max-w-4xl';
      if (baseWidth === 'max-w-7xl') return 'max-w-full';
    }
    return baseWidth;
  };

  const containerMaxWidth = getContainerMaxWidth();

  return (
    <div
      ref={mainScrollRef}
      onScroll={handleMainScroll}
      className="flex-1 overflow-y-auto py-4 sm:py-6 px-4 sm:px-6 relative scroll-gutter-stable scrollbar-thin"
    >
  <div className={`${containerMaxWidth} w-full mx-auto`}>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            viewMode='single'
            modelName={session.model_a?.display_name}
            onExpand={onExpand}
            onRegenerate={onRegenerate}
            canRegenerate={!isRegenerating && message.id === lastAssistantMessageId} 
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