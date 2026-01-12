import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage, removeStreamingMessage, updateSessionTitle, removeMessage, setIsRegenerating } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';
import { useTenant } from '../../../shared/context/TenantContext';

export function useStreamingMessage() {
  const dispatch = useDispatch();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();

  const generateAndUpdateTitle = useCallback(async (sessionId) => {
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/generate_title/`);
      if (response.data.title) {
        dispatch(updateSessionTitle({
          sessionId,
          title: response.data.title
        }));
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    }
  }, [dispatch]);

  const unescapeChunk = (chunk) => chunk.replace(/\\\\/g, '\\').replace(/\\n/g, '\n');

  const streamMessage = useCallback(async ({
    sessionId,
    content,
    modelId,
    parent_message_ids = [],
    language = null,
    imageUrl = null,
    imagePath = null,
    audioUrl = null,
    audioPath = null,
    docUrl = null,
    docPath = null
  }) => {
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4();

    // Add user message immediately
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content,
      parent_message_ids,
      status: 'pending',
      ...(language && { language }),
      ...(imageUrl && { temp_image_url: imageUrl }),
      ...(imagePath && { image_path: imagePath }),
      ...(audioUrl && { temp_audio_url: audioUrl }),
      ...(audioPath && { audio_path: audioPath }),
      ...(docUrl && { temp_doc_url: docUrl }),
      ...(docPath && { doc_path: docPath }),
    };

    // Add AI message placeholder
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      parent_message_ids: [userMessageId],
      modelId,
      status: 'pending',
    };

    // Add both to Redux immediately
    dispatch(addMessage({ sessionId, message: userMessage }));
    dispatch(updateStreamingMessage({ sessionId, messageId: aiMessageId, chunk: "", isComplete: false, parentMessageIds: [userMessageId] }));
    // dispatch(addMessage({ sessionId, message: aiMessage }));

    try {
      // Get fresh tenant value at call time (not from closure)
      const tenant = urlTenant || contextTenant;
      const baseUrl = tenant ? `${apiClient.defaults.baseURL}/${tenant}` : apiClient.defaults.baseURL;
      const url = `${baseUrl}${endpoints.messages.stream}`;

      // Get appropriate token
      const token = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (anonymousToken) {
        headers['X-Anonymous-Token'] = anonymousToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage, aiMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      if (parent_message_ids.length === 0) {
        generateAndUpdateTitle(sessionId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let bufferA = '';
      let lastFlush = Date.now();

      const FLUSH_INTERVAL = 75;

      const flushBuffers = () => {
        const now = Date.now();
        if (now - lastFlush < FLUSH_INTERVAL) return;
        dispatch(updateStreamingMessage({
          sessionId,
          messageId: aiMessageId,
          chunk: unescapeChunk(bufferA),
          isComplete: false,
        }));
        bufferA = '';
        lastFlush = now;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('a0:')) {
            const content = line.slice(4, -1);
            bufferA += content;
            flushBuffers();
          } else if (line.startsWith('ad:')) {
            // Stream done
            if (bufferA) {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                chunk: unescapeChunk(bufferA),
                isComplete: false,
              }));
              bufferA = '';
            }
            const data = JSON.parse(line.slice(3));
            if (data.finishReason === 'error') {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                isComplete: true,
                status: 'error',
                error: data.error || 'An unknown generation error occurred.',
              }));
            } else {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                chunk: '',
                isComplete: true,
                status: 'success',
              }));
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      dispatch(updateStreamingMessage({
        sessionId,
        messageId: aiMessageId,
        isComplete: true,
        status: 'error',
        error: error.message || 'Failed to connect to the server.',
      }));
      // throw error;
    }
  }, [dispatch, generateAndUpdateTitle, urlTenant, contextTenant]);

  const regenerateMessage = useCallback(async ({
    sessionId,
    messageToRegenerate,
  }) => {
    if (!messageToRegenerate.id || messageToRegenerate.role !== 'assistant') {
      throw new Error('Invalid message for regeneration');
    }

    const aiMessageId = messageToRegenerate.id;
    const participant = messageToRegenerate.participant || null;

    dispatch(setIsRegenerating(true));

    dispatch(removeMessage({ sessionId, messageId: aiMessageId }));

    dispatch(updateStreamingMessage({
      sessionId,
      messageId: aiMessageId,
      chunk: "",
      isComplete: false,
      parentMessageIds: messageToRegenerate.parent_message_ids,
      ...(participant && { participant }),
    }));

    try {
      // Get fresh tenant value at call time (not from closure)
      const tenant = urlTenant || contextTenant;
      const baseUrl = tenant ? `${apiClient.defaults.baseURL}/${tenant}` : apiClient.defaults.baseURL;
      const url = `${baseUrl}/messages/${aiMessageId}/regenerate/`;

      // Get appropriate token
      const token = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (anonymousToken) {
        headers['X-Anonymous-Token'] = anonymousToken;
      }

      const response = await fetch(
        url,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let bufferA = '';
      let lastFlush = Date.now();

      const FLUSH_INTERVAL = 75;

      const flushBuffers = () => {
        const now = Date.now();
        if (now - lastFlush < FLUSH_INTERVAL) return;
        dispatch(updateStreamingMessage({
          sessionId,
          messageId: aiMessageId,
          chunk: unescapeChunk(bufferA),
          isComplete: false,
          ...(participant && { participant }),
        }));
        bufferA = '';
        lastFlush = now;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('a0:') || line.startsWith('b0:')) {
            const content = line.slice(4, -1);
            bufferA += content;
            flushBuffers();
          } else if (line.startsWith('ad:') || line.startsWith('bd:')) {
            if (bufferA) {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                chunk: unescapeChunk(bufferA),
                isComplete: false,
                ...(participant && { participant }),
              }));
              bufferA = '';
            }
            const data = JSON.parse(line.slice(3));
            if (data.finishReason === 'error') {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                chunk: '',
                isComplete: true,
                status: 'error',
                error: data.error,
                ...(participant && { participant }),
              }));
            } else {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageId,
                chunk: '',
                isComplete: true,
                status: 'success',
                ...(participant && { participant }),
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      dispatch(updateStreamingMessage({
        sessionId,
        messageId: aiMessageId,
        isComplete: true,
        status: 'error',
        error: error.message || 'Failed to connect to the server.',
        ...(participant && { participant }),
      }));
      // throw error;
    } finally {
      dispatch(setIsRegenerating(false));
    }
  }, [dispatch, urlTenant, contextTenant]);

  /**
   * Generate AI response for an existing user message (e.g., after branch creation)
   * Calls the backend generate_response endpoint which creates and streams assistant message
   */
  const generateBranchResponse = useCallback(async ({
    sessionId,
    userMessageId,
  }) => {
    // Create a temporary ID for the streaming message display
    let tempAiMessageId = uuidv4();
    let realAiMessageId = null;
    let parentMessageIds = [userMessageId];
    
    // Start streaming placeholder
    dispatch(updateStreamingMessage({ 
      sessionId, 
      messageId: tempAiMessageId, 
      chunk: "", 
      isComplete: false, 
      parentMessageIds 
    }));

    try {
      const tenant = urlTenant || contextTenant;
      const baseUrl = tenant ? `${apiClient.defaults.baseURL}/${tenant}` : apiClient.defaults.baseURL;
      const url = `${baseUrl}${endpoints.messages.generateResponse(userMessageId)}`;

      const token = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (anonymousToken) {
        headers['X-Anonymous-Token'] = anonymousToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(`Server responded with status ${response.status}`), { response: { data: errorData } });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let bufferA = '';
      let lastFlush = Date.now();
      const FLUSH_INTERVAL = 75;
      let fullContent = '';

      const flushBuffers = () => {
        const now = Date.now();
        if (now - lastFlush < FLUSH_INTERVAL) return;
        const currentId = realAiMessageId || tempAiMessageId;
        dispatch(updateStreamingMessage({
          sessionId,
          messageId: currentId,
          chunk: unescapeChunk(bufferA),
          isComplete: false,
        }));
        bufferA = '';
        lastFlush = now;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Handle message ID from backend (am: prefix)
          if (line.startsWith('am:')) {
            try {
              const msgData = JSON.parse(line.slice(3));
              realAiMessageId = msgData.messageId;
              parentMessageIds = msgData.parentMessageIds || [userMessageId];
              
              // If we have a temp message, we need to transition to real ID
              // Remove temp streaming message and create new one with real ID
              if (tempAiMessageId !== realAiMessageId) {
                dispatch(removeStreamingMessage({ sessionId, messageId: tempAiMessageId }));
                dispatch(updateStreamingMessage({ 
                  sessionId, 
                  messageId: realAiMessageId, 
                  chunk: '', 
                  isComplete: false, 
                  parentMessageIds 
                }));
              }
            } catch (e) {
              console.warn('Failed to parse message ID:', e);
            }
          } else if (line.startsWith('a0:')) {
            const content = line.slice(4, -1);
            bufferA += content;
            fullContent += unescapeChunk(content);
            flushBuffers();
          } else if (line.startsWith('ad:')) {
            const currentId = realAiMessageId || tempAiMessageId;
            if (bufferA) {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: currentId,
                chunk: unescapeChunk(bufferA),
                isComplete: false,
              }));
              bufferA = '';
            }
            const data = JSON.parse(line.slice(3));
            if (data.finishReason === 'error') {
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: currentId,
                isComplete: true,
                status: 'error',
                error: data.error || 'An unknown generation error occurred.',
              }));
            } else {
              // Success - finalize the message
              // updateStreamingMessage with isComplete=true will automatically add to messages
              dispatch(updateStreamingMessage({
                sessionId,
                messageId: currentId,
                chunk: '',
                isComplete: true,
                status: 'success',
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Branch response generation error:', error);
      const currentId = realAiMessageId || tempAiMessageId;
      dispatch(updateStreamingMessage({
        sessionId,
        messageId: currentId,
        isComplete: true,
        status: 'error',
        error: error.message || 'Failed to generate response.',
      }));
      throw error;
    }
  }, [dispatch, urlTenant, contextTenant]);

  return { streamMessage, regenerateMessage, generateBranchResponse };
}