import { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { useSelector } from 'react-redux';

export function MessageList({ messages, streamingMessages, session, onExpand, onRegenerate }) {
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

  return (
    <div
      ref={mainScrollRef}
      onScroll={handleMainScroll}
      className="flex-1 overflow-y-auto p-2 sm:p-4 relative scroll-gutter-stable"
    >
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
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