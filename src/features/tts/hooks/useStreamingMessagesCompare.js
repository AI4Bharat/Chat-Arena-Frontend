import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { addMessage, updateStreamingMessageTTS, updateSessionTitle, updateMessageContent } from '../store/chatSlice';
import { v4 as uuidv4 } from 'uuid';

export function useStreamingMessageCompare() {
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

    const streamMessageCompare = useCallback(async ({
        sessionId,
        content,
        modelAId,
        modelBId,
        parent_message_ids = [],
        language,
    }) => {
        const userMessageId = uuidv4();
        const aiMessageIdA = uuidv4();
        const aiMessageIdB = uuidv4();

        // Add user message immediately
        const userMessage = {
            id: userMessageId,
            role: 'user',
            content,
            parent_message_ids,
            status: 'pending',
            language
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
            language,
        };

        const aiMessageB = {
            id: aiMessageIdB,
            role: 'assistant',
            content: '',
            parent_message_ids: [userMessageId],
            modelId: modelBId,
            status: 'pending',
            participant: 'b',
            language,
        };

        // Add both to Redux immediately
        dispatch(addMessage({ sessionId, message: userMessage }));
        dispatch(updateStreamingMessageTTS({ sessionId, messageId: aiMessageIdA, chunk: "", isComplete: false, participant: 'a', language }));
        dispatch(updateStreamingMessageTTS({ sessionId, messageId: aiMessageIdB, chunk: "", isComplete: false, participant: 'b', language }));

        try {
            const response = await fetchWithAuth(`${apiClient.defaults.baseURL}${endpoints.messages.stream}`, {
                method: 'POST',
                body: JSON.stringify({
                    session_id: sessionId,
                    messages: [userMessage, aiMessageA, aiMessageB],
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    // Handle prompt update for academic mode
                    if (line.startsWith('prompt:')) {
                        const promptContent = line.slice(8, -1)
                            .replace(/\\n/g, '\n')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');
                        dispatch(updateMessageContent({
                            sessionId,
                            messageId: userMessageId,
                            content: promptContent
                        }));
                    }

                    else if (line.startsWith('a0:')) {
                        const content = line.slice(4, -1);
                        dispatch(updateStreamingMessageTTS({
                            sessionId,
                            messageId: aiMessageIdA,
                            chunk: content,
                            isComplete: false,
                            participant: 'a',
                        }));
                    }

                    else if (line.startsWith('b0:')) {
                        const content = line.slice(4, -1);
                        dispatch(updateStreamingMessageTTS({
                            sessionId,
                            messageId: aiMessageIdB,
                            chunk: content,
                            isComplete: false,
                            participant: 'b',
                        }));
                    }

                    else if (line.startsWith('ad:')) {
                        try {
                            const data = JSON.parse(line.slice(3));
                            if (data.finishReason === 'stop') {
                                modelStatus.a.complete = true;
                                dispatch(updateStreamingMessageTTS({
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
                                dispatch(updateStreamingMessageTTS({
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
                            const data = JSON.parse(line.slice(3));
                            if (data.finishReason === 'stop') {
                                modelStatus.b.complete = true;
                                dispatch(updateStreamingMessageTTS({
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
                                dispatch(updateStreamingMessageTTS({
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
            dispatch(updateStreamingMessageTTS({
                sessionId,
                messageId: aiMessageIdA,
                isComplete: true,
                status: 'error',
                participant: 'a',
                error: error || 'Failed to connect to the server.',
            }));
            dispatch(updateStreamingMessageTTS({
                sessionId,
                messageId: aiMessageIdB,
                isComplete: true,
                status: 'error',
                participant: 'b',
                error: error || 'Failed to connect to the server.',
            }));
        }
    }, [dispatch, generateAndUpdateTitle]);

    return { streamMessageCompare };
}