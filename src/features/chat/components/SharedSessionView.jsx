import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { MessageList } from './MessageList';
import { Lock, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTenant } from '../../../shared/context/TenantContext';

export function SharedSessionView() {
  // Handler for expand button
  const handleExpand = (message) => {
    // For now, just show the full message in a modal or alert
    // You can replace this with a custom modal later
    window.alert(message.content);
  };
  const { shareToken, tenant: urlTenant } = useParams();
  const navigate = useNavigate();
  const { tenant: contextTenant } = useTenant();
  const currentTenant = urlTenant || contextTenant;
  const [messages, setMessages] = useState([]);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['sharedSession', shareToken],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.sessions.shared(shareToken));
      console.log('Shared session response:', response.data);
      console.log('Messages:', response.data.messages);
      setMessages(response.data.messages || []);
      return response.data.session;
    },
  });

  const handleContinueInPlayground = () => {
    const isAuthenticated = localStorage.getItem('authToken');
    if (isAuthenticated) {
      if (currentTenant) {
        navigate(`/${currentTenant}/chat`);
      } else {
        navigate('/chat');
      }
      // TODO: Load this session in the chat
    } else {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid or expired share link
          </h2>
          <button
            onClick={() => {
              if (currentTenant) {
                navigate(`/${currentTenant}/chat`);
              } else {
                navigate('/');
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Playground
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Shared Conversation</h1>
              <p className="text-sm text-gray-500 mt-1">
                {session.mode === 'compare'
                  ? `${session.model_a?.display_name} vs ${session.model_b?.display_name}`
                  : session.model_a?.display_name}
              </p>
            </div>
            <button
              onClick={handleContinueInPlayground}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 transition-all"
            >
              <ExternalLink size={14} className="sm:mr-1" />
              <span className="hidden xs:inline">Continue in Playground</span>
              <span className="inline xs:hidden">Continue</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No messages in this conversation yet.</p>
              <p className="text-sm mt-2">Debug: Messages count: {messages.length}</p>
            </div>
          ) : session.mode === 'compare' ? (
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h3 className="font-medium text-gray-700 mb-4">{session.model_a?.display_name}</h3>
                <MessageList
                  messages={messages.filter((msg, idx) =>
                    msg.role === 'user' || (msg.role === 'assistant' && idx % 2 === 1)
                  )}
                  streamingMessages={{}}
                  session={session}
                  onExpand={handleExpand}
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-700 mb-4">{session.model_b?.display_name}</h3>
                <MessageList
                  messages={messages.filter((msg, idx) =>
                    msg.role === 'user' || (msg.role === 'assistant' && idx % 2 === 0)
                  )}
                  streamingMessages={{}}
                  session={session}
                  onExpand={handleExpand}
                />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <MessageList messages={messages} streamingMessages={{}} session={session} onExpand={handleExpand} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}