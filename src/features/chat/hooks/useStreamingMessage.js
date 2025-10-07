import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';

export function useStreamingMessage() {
  const dispatch = useDispatch();

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
    dispatch(updateStreamingMessage({ sessionId, messageId: aiMessageId, chunk: "", isComplete: false}));
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
  }, [dispatch]);

  return { streamMessage };
}