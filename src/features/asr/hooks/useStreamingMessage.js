import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage, updateSessionTitle, removeMessage, setIsRegenerating } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';
import { useTenant } from '../../../shared/context/TenantContext';

export function useStreamingMessage() {
  const dispatch = useDispatch();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;

  // Helper to build tenant-aware URL
  const getTenantUrl = useCallback((path) => {
    if (tenant) {
      return `${apiClient.defaults.baseURL}/${tenant}${path}`;
    }
    return `${apiClient.defaults.baseURL}${path}`;
  }, [tenant]);

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
    url,
    modelId,
    parent_message_ids = [],
    path,
    language,
  }) => {
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4();

    // Add user message immediately
    const userMessage = {
      id: userMessageId,
      role: 'user',
      temp_audio_url: url,
      audio_path: path,
      language: language,
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

    // Keep temp_audio_url in the payload sent to backend since it needs it for ASR
    // Only use userMessage directly, don't strip temp_audio_url

    try {
      const response = await fetch(getTenantUrl(endpoints.messages.stream), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('access_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            : { 'X-Anonymous-Token': localStorage.getItem('anonymous_token') }),
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage, aiMessage],
          mode: 'ASR',
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
  }, [dispatch, generateAndUpdateTitle, getTenantUrl]);

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
        getTenantUrl(`/messages/${aiMessageId}/regenerate/`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('access_token')
              ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
              : { 'X-Anonymous-Token': localStorage.getItem('anonymous_token') }),
          },
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
  }, [dispatch, getTenantUrl]);

  return { streamMessage, regenerateMessage };
}