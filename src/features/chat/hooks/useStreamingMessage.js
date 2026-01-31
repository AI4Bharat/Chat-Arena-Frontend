import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage, updateSessionTitle, removeMessage, setIsRegenerating } from '../store/chatSlice';
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
    docPath = null,
    searchEnabled = false
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
      ...(searchEnabled && { metadata: { searching: true, searchQuery: content } }),
    };

    // Add both to Redux immediately
    dispatch(addMessage({ sessionId, message: userMessage }));
    dispatch(updateStreamingMessage({
      sessionId,
      messageId: aiMessageId,
      chunk: "",
      isComplete: false,
      parentMessageIds: [userMessageId],
      metadata: searchEnabled ? { searching: true, searchQuery: content, searchStartTime: Date.now() } : undefined
    }));
    // dispatch(addMessage({ sessionId, message: aiMessage }));

    try {
      // Get fresh tenant value at call time (not from closure)
      const tenant = urlTenant || contextTenant;
      const baseUrl = tenant ? `${apiClient.defaults.baseURL}/${tenant}` : apiClient.defaults.baseURL;
      const url = `${baseUrl}${endpoints.messages.stream}`;

      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          messages: [userMessage, aiMessage],
          search_enabled: searchEnabled,
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

      let searchStartTime = Date.now();

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
            let content = line.slice(4, -1);

            // Append new content to the pending buffer for marker processing
            // We use a dedicated local buffer for parsing to handle split markers
            let parsingBuffer = (window.pendingSearchBuffer || '') + content;

            const searchMarkerStart = '[SEARCH:{';
            let markerIndex;

            // Loop to find and process all complete markers in the buffer
            while ((markerIndex = parsingBuffer.indexOf(searchMarkerStart)) !== -1) {
              const endIndex = parsingBuffer.indexOf('}]', markerIndex);

              if (endIndex !== -1) {
                // We have a complete marker from markerIndex to endIndex + 2
                const fullMarker = parsingBuffer.slice(markerIndex, endIndex + 2);
                const jsonStr = parsingBuffer.slice(markerIndex + 8, endIndex + 1); // Extract JSON part

                try {
                  const searchInfo = JSON.parse(jsonStr);
                  dispatch(updateStreamingMessage({
                    sessionId,
                    messageId: aiMessageId,
                    chunk: '',
                    isComplete: false,
                    metadata: {
                      searching: searchInfo.status !== 'completed',
                      searchQuery: searchInfo.query || '',
                      searchMessage: searchInfo.message || 'Searching...',
                      searchUrl: searchInfo.url || null,
                      searchStartTime: searchStartTime || Date.now(),
                    }
                  }));
                } catch (e) {
                  // Ignore malformed JSON
                }

                // Remove the marker from the buffer
                parsingBuffer = parsingBuffer.slice(0, markerIndex) + parsingBuffer.slice(endIndex + 2);
              } else {
                // We have a start, but no end yet. Stop processing and wait for more chunks.
                break;
              }
            }

            // Check for potential partial markers at the end of the buffer
            // e.g. "Hello [SEAR" -> wait. "Hello [SEARCH:{...}" -> processed above. "Hello" -> clean.
            // We check if the end of the string looks like the start of a marker
            // The marker starts with [SEARCH:

            let safeEndIndex = parsingBuffer.length;
            const potentialStart = parsingBuffer.lastIndexOf('[');

            if (potentialStart !== -1) {
              // Check if it matches the beginning of our tag
              const suffix = parsingBuffer.slice(potentialStart);
              if (searchMarkerStart.startsWith(suffix)) {
                // It matches "[", "[S", "[SEARCH", etc. 
                // It's a partial marker, hold it back.
                safeEndIndex = potentialStart;
              }
            }

            // Extract the 'clean' content that is definitely safely text
            const cleanContent = parsingBuffer.slice(0, safeEndIndex);

            // Update the persistent buffer with the remainder (partial marker)
            window.pendingSearchBuffer = parsingBuffer.slice(safeEndIndex);

            if (cleanContent) {
              // If we have actual content (and it's not just whitespace/markers), 
              // we can confirm search is done if it wasn't already.
              if (cleanContent.trim().length > 0) {
                dispatch(updateStreamingMessage({
                  sessionId,
                  messageId: aiMessageId,
                  chunk: '',
                  metadata: { searching: false } // Auto-stop animation on text
                }));
              }

              bufferA += cleanContent;
              flushBuffers();
            }
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

      const response = await fetchWithAuth(url, {
        method: 'POST',
      });

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

  return { streamMessage, regenerateMessage };
}