import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const createSession = createAsyncThunk(
  'chat/createSession',
  async ({ mode, modelA, modelB, type, metadata }) => {
    const response = await apiClient.post(endpoints.sessions.create, {
      mode,
      model_a_id: modelA,
      model_b_id: modelB,
      session_type: type,
      metadata: metadata || {}
    });
    return response.data;
  }
);

export const fetchSessions = createAsyncThunk(
  'chat/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_llm);
    return response.data;
  }
);

export const fetchSessionById = createAsyncThunk(
  'chat/fetchSessionById',
  async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/`);
    return response.data;
  }
);

export const renameSession = createAsyncThunk(
  "chat/renameSession",
  async ({ sessionId, title }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, {
        title,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const togglePinSession = createAsyncThunk(
  'chat/togglePinSession',
  async ({ sessionId, isPinned }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, {
        is_pinned: isPinned,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessions: [],
    activeSession: null,
    messages: {},
    streamingMessages: {},
    loading: false,
    error: null,
    selectedMode: 'random',
    selectedModels: {
      modelA: null,
      modelB: null,
    },
    isRegenerating: false,
    selectedLanguage: localStorage.getItem('selected_language') || 'hi',
    isStreaming: false,
    isTranslateEnabled: false,
    messageInputHeight: 104,
  },
  reducers: {
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
      state.isStreaming = false; // Reset streaming state on session switch
    },
    setIsStreaming: (state, action) => {
      state.isStreaming = action.payload;
    },
    addMessage: (state, action) => {
      const { sessionId, message } = action.payload;
      if (!state.messages[sessionId]) {
        state.messages[sessionId] = [];
      }
      state.messages[sessionId].push(message);
    },
    updateStreamingMessage: (state, action) => {
      const {
        sessionId,
        messageId,
        chunk,
        isComplete,
        participant = "a",
        parentMessageIds,
        status,
        error,
      } = action.payload;

      if (!state.streamingMessages[sessionId]) {
        state.streamingMessages[sessionId] = {};
      }

      if (!state.streamingMessages[sessionId][messageId]) {
        state.streamingMessages[sessionId][messageId] = {
          content: '',
          isComplete: false,
          parentMessageIds: parentMessageIds || [],
          status: status || 'streaming',
          error: error || null,
        };
      }

      const streamingMsg = state.streamingMessages[sessionId][messageId];
      streamingMsg.content += chunk || '';
      streamingMsg.participant = participant;
      streamingMsg.isComplete = isComplete;
      if (status) {
        streamingMsg.status = status;
      }
      if (error) {
        streamingMsg.error = error;
      }

      if (isComplete) {
        // Move to regular messages
        const message = {
          id: messageId,
          content: streamingMsg.content,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          participant: participant,
          parent_message_ids: streamingMsg.parentMessageIds,
          status: streamingMsg.status || 'success',
          error: streamingMsg.error || null,
        };

        if (!state.messages[sessionId]) {
          state.messages[sessionId] = [];
        }
        state.messages[sessionId].push(message);

        delete state.streamingMessages[sessionId][messageId];
      }
    },
    setSessionState: (state, action) => {
      const { sessionId, messages, sessionData } = action.payload;
      state.messages[sessionId] = messages || [];
      const sessionIndex = state.sessions.findIndex((s) => s.id === sessionId);
      if (sessionIndex !== -1 && sessionData) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          ...sessionData,
        };
      }
    },
    updateMessageFeedback: (state, action) => {
      const { sessionId, messageId, feedback } = action.payload;
      const messageIndex = state.messages[sessionId].findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex !== -1) {
        state.messages[sessionId][messageIndex].feedback = feedback;
      }
    },
    clearMessages: (state) => {
      if (state.activeSession?.id) {
        delete state.messages[state.activeSession.id];
        delete state.streamingMessages[state.activeSession.id];
      }
    },
    setSelectedMode: (state, action) => {
      state.selectedMode = action.payload;
    },
    setSelectedModels: (state, action) => {
      state.selectedModels = action.payload;
    },
    updateSessionTitle: (state, action) => {
      const { sessionId, title } = action.payload;
      const sessionIndex = state.sessions.findIndex((s) => s.id === sessionId);
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex].title = title;
      }
      if (state.activeSession?.id === sessionId) {
        state.activeSession.title = title;
      }
    },
    updateMessageRating: (state, action) => {
      const { sessionId, messageId, rating } = action.payload;
      const messages = state.messages[sessionId];
      if (messages) {
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          message.feedback = rating;
        }
      }
    },
    removeMessage: (state, action) => {
      const { sessionId, messageId } = action.payload;
      if (state.messages[sessionId]) {
        state.messages[sessionId] = state.messages[sessionId].filter(
          (msg) => msg.id !== messageId
        );
      }
    },
    setIsRegenerating: (state, action) => {
      state.isRegenerating = action.payload;
    },
    setSelectedLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
      localStorage.setItem('selected_language', action.payload);
    },
    setIsTranslateEnabled: (state, action) => {
      state.isTranslateEnabled = action.payload;
    },
    resetLanguageSettings: (state) => {
      state.selectedLanguage = localStorage.getItem('selected_language') || 'hi';
      state.isTranslateEnabled = false;
    },
    setMessageInputHeight(state, action) {
      state.messageInputHeight = action.payload;
    },
    updateActiveSessionData: (state, action) => {
      const updatedSession = action.payload;
      if (state.activeSession && state.activeSession.id === updatedSession.id) {
        state.activeSession = { ...state.activeSession, ...updatedSession };
      }
      const sessionIndex = state.sessions.findIndex(
        (s) => s.id === updatedSession.id
      );
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          ...updatedSession,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSession.fulfilled, (state, action) => {
        const newSessionFull = action.payload;
        state.activeSession = newSessionFull;
        state.messages[newSessionFull.id] = [];
        const newSessionForList = {
          id: newSessionFull.id,
          mode: newSessionFull.mode,
          title: newSessionFull.title,
          model_a_name: newSessionFull.model_a?.display_name || 'Model A',
          model_b_name: newSessionFull.model_b?.display_name || 'Model B',
          created_at: newSessionFull.created_at,
          updated_at: newSessionFull.updated_at,
          message_count: 0,
        };
        state.sessions.unshift(newSessionForList);
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        const { session, messages } = action.payload;
        state.activeSession = session;
        const exists = state.sessions.find((s) => s.id === session.id);
        if (!exists) {
          state.sessions.unshift(session);
        }
        if (!state.messages[session.id]) {
          state.messages[session.id] = messages;
        }
      })
      .addCase(togglePinSession.pending, (state, action) => {
        const { sessionId, isPinned } = action.meta.arg;
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          session.is_pinned = isPinned;
        }
      })

      .addCase(togglePinSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.sessions[index] = {
            ...state.sessions[index],
            ...action.payload
          };
        }
      })

      .addCase(togglePinSession.rejected, (state, action) => {
        const { sessionId, isPinned } = action.meta.arg;
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          session.is_pinned = !isPinned;
        }
        console.error("Failed to update pin status");
      })
      .addCase(renameSession.fulfilled, (state, action) => {
        const { id, title } = action.payload;
        const sessionIndex = state.sessions.findIndex((s) => s.id === id);
        if (sessionIndex !== -1) {
          state.sessions[sessionIndex].title = title;
        }
        if (state.activeSession?.id === id) {
          state.activeSession.title = title;
        }
      });
  },
});

export const {
  setActiveSession,
  addMessage,
  updateStreamingMessage,
  setSessionState,
  updateMessageFeedback,
  setSelectedMode,
  setSelectedModels,
  clearMessages,
  updateSessionTitle,
  removeMessage,
  setIsRegenerating,
  setIsStreaming,
  setSelectedLanguage,
  setIsTranslateEnabled,
  resetLanguageSettings,
  setMessageInputHeight,
  updateMessageRating,
  updateActiveSessionData,
} = chatSlice.actions;
export default chatSlice.reducer;