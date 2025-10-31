import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage, updateSessionTitle, removeMessage, setIsRegenerating } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';

export function useStreamingMessage() {
  const dispatch = useDispatch();

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
    parent_message_ids = []
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
      const response = await fetch(`${apiClient.defaults.baseURL}${endpoints.messages.stream}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage, aiMessage],
        }),
      });

      if (!response.ok) throw new Error('Stream request failed');

      if (parent_message_ids.length === 0) {
        generateAndUpdateTitle(sessionId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('a0:')) {
            const content = line.slice(4, -1);
            dispatch(updateStreamingMessage({
              sessionId,
              messageId: aiMessageId,
              chunk: unescapeChunk(content),
              isComplete: false,
            }));
          } else if (line.startsWith('ad:')) {
            // Stream done
            dispatch(updateStreamingMessage({
              sessionId,
              messageId: aiMessageId,
              chunk: '',
              isComplete: true,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }, [dispatch, generateAndUpdateTitle]);

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
      const response = await fetch(
        `${apiClient.defaults.baseURL}/messages/${aiMessageId}/regenerate/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Regenerate request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('a0:') || line.startsWith('b0:')) {
            const content = line.slice(4, -1);
            dispatch(updateStreamingMessage({
              sessionId,
              messageId: aiMessageId,
              chunk: unescapeChunk(content),
              isComplete: false,
              ...(participant && { participant }),
            }));
          } else if (line.startsWith('ad:') || line.startsWith('bd:')) {
            dispatch(updateStreamingMessage({
              sessionId,
              messageId: aiMessageId,
              chunk: '',
              isComplete: true,
              ...(participant && { participant }),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      dispatch(updateStreamingMessage({
        sessionId,
        messageId: aiMessageId,
        chunk: `Error: ${error.message}`,
        isComplete: true,
        ...(participant && { participant }),
      }));
      throw error;
    } finally{
      dispatch(setIsRegenerating(false));
    }
  }, [dispatch]);

  return { streamMessage, regenerateMessage };
}