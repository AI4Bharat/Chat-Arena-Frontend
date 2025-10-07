import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';

export function MessageList({ messages, streamingMessages, sessionId }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        
        {Object.entries(streamingMessages).map(([messageId, streamingData]) => (
          <MessageItem
            key={messageId}
            message={{
              id: messageId,
              content: streamingData.content,
              role: 'assistant',
              isStreaming: !streamingData.isComplete,
            }}
          />
        ))}
        
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}