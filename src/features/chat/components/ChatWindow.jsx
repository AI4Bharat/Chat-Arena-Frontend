import { useSelector } from 'react-redux';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { CompareView } from './CompareView';
import { EmptyChat } from './EmptyChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useEffect } from 'react';

export function ChatWindow() {
  const { activeSession, messages, streamingMessages } = useSelector((state) => state.chat);
  const { sendMessage } = useWebSocket(activeSession?.id);

  if (!activeSession) {
    return <EmptyChat />;
  }

  const sessionMessages = messages[activeSession.id] || [];
  const sessionStreamingMessages = streamingMessages[activeSession.id] || {};

  if (activeSession.mode === 'compare' || activeSession.mode === 'random') {
    return (
      <CompareView
        session={activeSession}
        messages={sessionMessages}
        streamingMessages={sessionStreamingMessages}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
      <MessageList
        messages={sessionMessages}
        streamingMessages={sessionStreamingMessages}
        sessionId={activeSession.id}
      />
      <div className="flex-shrink-0">
        <MessageInput sessionId={activeSession.id} modelId={activeSession.model_a?.id} />
      </div>
    </div>
  );
}