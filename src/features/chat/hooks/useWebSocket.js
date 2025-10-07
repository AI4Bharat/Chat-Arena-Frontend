import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { WS_BASE_URL } from '../../../shared/api/client';
import { updateStreamingMessage, setSessionState } from '../store/chatSlice';
import { toast } from 'react-hot-toast';
import { userService } from '../../auth/services/userService';

export function useWebSocket(sessionId) {
  const dispatch = useDispatch();
  const ws = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { activeSession, messages } = useSelector((state) => state.chat);

  const connect = useCallback(async () => {
    if (!sessionId || !user) return;

    try {
      // Build WebSocket URL with authentication
      let wsUrl = `${WS_BASE_URL}/chat/session/${sessionId}/`;
      
      // Add authentication query params
      const accessToken = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');
      
      if (accessToken) {
        wsUrl += `?token=${accessToken}`;
      } else if (anonymousToken) {
        wsUrl += `?anonymous_token=${anonymousToken}`;
      } else {
        console.error('No authentication token available');
        return;
      }

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('Connection established:', data);
              break;
              
            case 'message_chunk':
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: data.message_id,
                chunk: data.chunk,
                isComplete: false,
              }));
              break;
              
            case 'message_complete':
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: data.message_id,
                chunk: '',
                isComplete: true,
              }));
              break;
              
            case 'typing_indicator':
              // Handle typing indicator if needed
              break;
            case 'session_state':
              if (messages[activeSession.id]?.length === 0 || messages[activeSession.id]?.length === undefined) {
                dispatch(setSessionState({
                  sessionId,
                  messages: data.messages,
                  sessionData: data.session
                }));
              }
              break;
            case 'error':
              toast.error(data.message);
              break;
              
            default:
              console.log('Received message:', data.type, data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = async (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Handle authentication errors
        if (event.code === 1006 || event.code === 1008) {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken && reconnectAttempts.current === 0) {
            try {
              await userService.refreshAccessToken();
              // Immediate reconnect with new token
              reconnectAttempts.current = 0;
              connect();
              return;
            } catch (error) {
              console.error('Token refresh failed:', error);
              toast.error('Authentication failed. Please sign in again.');
              return;
            }
          }
        }

        // Attempt to reconnect for other closures
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current})`);
          reconnectTimer.current = setTimeout(connect, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Failed to connect to chat. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [sessionId, user, dispatch]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      toast.error('Connection not established. Attempting to reconnect...');
      connect();
    }
  }, [connect]);

  // Effect to handle connection
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Reconnect if user changes (e.g., from anonymous to authenticated)
  useEffect(() => {
    if (isConnected && ws.current) {
      disconnect();
      connect();
    }
  }, [user?.id]);

  return { 
    sendMessage, 
    isConnected,
    reconnect: connect,
    disconnect 
  };
}