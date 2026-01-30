import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessage, updateSessionTitle } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';
import { useTenant } from '../../../shared/context/TenantContext';

export function useStreamingMessageCompare() {
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

    const streamMessageCompare = useCallback(async ({
        sessionId,
        url,
        modelAId,
        modelBId,
        parent_message_ids = [],
        path,
        language,
    }) => {
        const userMessageId = uuidv4();
        const aiMessageIdA = uuidv4();
        const aiMessageIdB = uuidv4();

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
        const aiMessageA = {
            id: aiMessageIdA,
            role: 'assistant',
            content: '',
            parent_message_ids: [userMessageId],
            modelId: modelAId,
            status: 'pending',
            participant: 'a',
        };

        const aiMessageB = {
            id: aiMessageIdB,
            role: 'assistant',
            content: '',
            parent_message_ids: [userMessageId],
            modelId: modelBId,
            status: 'pending',
            participant: 'b',
        };

        // Add both to Redux immediately
        dispatch(addMessage({ sessionId, message: userMessage }));
        dispatch(updateStreamingMessage({ sessionId, messageId: aiMessageIdA, chunk: "", isComplete: false, participant: 'a', }));
        dispatch(updateStreamingMessage({ sessionId, messageId: aiMessageIdB, chunk: "", isComplete: false, participant: 'b', }));

        // Keep temp_audio_url in the payload sent to backend since it needs it for ASR

        try {
            const response = await fetchWithAuth(getTenantUrl(endpoints.messages.stream), {
                method: 'POST',
                body: JSON.stringify({
                    session_id: sessionId,
                    messages: [userMessage, aiMessageA, aiMessageB],
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

            const modelStatus = {
                a: { complete: false, error: null },
                b: { complete: false, error: null }
            };

            let bufferA = '';
            let bufferB = '';
            let lastFlush = Date.now();

            const FLUSH_INTERVAL = 75;

            const flushBuffers = () => {
                const now = Date.now();
                if (now - lastFlush < FLUSH_INTERVAL) return;
                if (bufferA) {
                    dispatch(updateStreamingMessage({
                        sessionId,
                        messageId: aiMessageIdA,
                        chunk: unescapeChunk(bufferA),
                        isComplete: false,
                        participant: 'a',
                    }));
                    bufferA = '';
                }
                if (bufferB) {
                    dispatch(updateStreamingMessage({
                        sessionId,
                        messageId: aiMessageIdB,
                        chunk: unescapeChunk(bufferB),
                        isComplete: false,
                        participant: 'b',
                    }));
                    bufferB = '';
                }
                lastFlush = now;
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    if (line.startsWith('a0:')) {
                        const content = line.slice(4, -1);
                        bufferA += content;
                        flushBuffers();
                    }

                    else if (line.startsWith('b0:')) {
                        const content = line.slice(4, -1);
                        bufferB += content;
                        flushBuffers();
                    }

                    else if (line.startsWith('ad:')) {
                        try {
                            if (bufferA) {
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdA,
                                    chunk: unescapeChunk(bufferA),
                                    isComplete: false,
                                    participant: 'a',
                                }));
                                bufferA = '';
                            }
                            const data = JSON.parse(line.slice(3));
                            if (data.finishReason === 'stop') {
                                modelStatus.a.complete = true;
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdA,
                                    chunk: '',
                                    isComplete: true,
                                    participant: 'a',
                                }));
                            } else if (data.finishReason === 'error') {
                                modelStatus.a.complete = true;
                                modelStatus.a.error = data.error;
                                console.log(`Model A error: ${data.error}`);
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdA,
                                    isComplete: true,
                                    status: 'error',
                                    participant: 'a',
                                    error: data.error || 'An unknown generation error occurred.',
                                }));
                            }
                        } catch (e) {
                            console.error('Failed to parse model A done signal:', e);
                        }
                    }

                    else if (line.startsWith('bd:')) {
                        try {
                            if (bufferB) {
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdB,
                                    chunk: unescapeChunk(bufferB),
                                    isComplete: false,
                                    participant: 'b',
                                }));
                                bufferB = '';
                            }
                            const data = JSON.parse(line.slice(3));
                            if (data.finishReason === 'stop') {
                                modelStatus.b.complete = true;
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdB,
                                    chunk: '',
                                    isComplete: true,
                                    participant: 'b',
                                }));
                            } else if (data.finishReason === 'error') {
                                modelStatus.b.complete = true;
                                modelStatus.b.error = data.error;
                                console.log(`Model B error: ${data.error}`);
                                dispatch(updateStreamingMessage({
                                    sessionId,
                                    messageId: aiMessageIdB,
                                    isComplete: true,
                                    status: 'error',
                                    participant: 'b',
                                    error: data.error || 'An unknown generation error occurred.',
                                }));
                            }
                        } catch (e) {
                            console.error('Failed to parse model B done signal:', e);
                        }
                    }
                }

                if (modelStatus.a.complete && modelStatus.b.complete) {
                    break;
                }
            }

        } catch (error) {
            console.error('Streaming comparison error:', error);
            dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageIdA,
                isComplete: true,
                status: 'error',
                participant: 'a',
                error: error || 'Failed to connect to the server.',
            }));
            dispatch(updateStreamingMessage({
                sessionId,
                messageId: aiMessageIdB,
                isComplete: true,
                status: 'error',
                participant: 'b',
                error: error || 'Failed to connect to the server.',
            }));
        }
    }, [dispatch, generateAndUpdateTitle, getTenantUrl]);

    return { streamMessageCompare };
}