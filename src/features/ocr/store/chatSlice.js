import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { v4 as uuidv4 } from 'uuid';

// ── Undo/Redo helpers ────────────────────────────────────────────────────────
const MAX_HISTORY = 50;

function ensureHistory(state, sessionId, participant) {
  if (!state.annotationHistory[sessionId]) state.annotationHistory[sessionId] = { modelA: [], modelB: [] };
  if (!state.annotationFuture[sessionId])  state.annotationFuture[sessionId]  = { modelA: [], modelB: [] };
}

function pushHistory(state, sessionId, participant) {
  ensureHistory(state, sessionId, participant);
  const current = state.annotations[sessionId]?.[participant] || [];
  const stack = state.annotationHistory[sessionId][participant];
  stack.push(current.map(a => ({ ...a, box: [...a.box] })));
  if (stack.length > MAX_HISTORY) stack.shift();
  // Any new action clears the redo future
  state.annotationFuture[sessionId][participant] = [];
}

function syncEdited(state, sessionId, participant) {
  const arr = state.annotations[sessionId]?.[participant] || [];
  if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {}, modelB: {} };
  const byId = {};
  arr.forEach(a => { byId[a.id] = { ...a }; });
  state.editedAnnotations[sessionId][participant] = byId;
}

export const createSession = createAsyncThunk(
  'ocrChat/createSession',
  async ({ mode, modelA, modelB, type }) => {
    const response = await apiClient.post(endpoints.sessions.create, {
      mode,
      model_a_id: modelA,
      model_b_id: modelB,
      session_type: type,
    });
    return response.data;
  }
);

export const fetchSessions = createAsyncThunk(
  'ocrChat/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_ocr);
    return response.data;
  }
);

export const fetchSessionById = createAsyncThunk(
  'ocrChat/fetchSessionById',
  async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/`);
    return response.data;
  }
);

export const renameSession = createAsyncThunk(
  'ocrChat/renameSession',
  async ({ sessionId, title }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, { title });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteSession = createAsyncThunk(
  'ocrChat/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/`);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const togglePinSession = createAsyncThunk(
  'ocrChat/togglePinSession',
  async ({ sessionId, isPinned }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, { is_pinned: isPinned });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const chatSlice = createSlice({
  name: 'ocrChat',
  initialState: {
    sessions: [],
    activeSession: null,
    messages: {},
    loading: false,
    error: null,
    selectedMode: 'direct',
    selectedModels: { modelA: null, modelB: null },

    // OCR-specific state
    pages: [],                    // [{ path, url, width, height }] — one per document page
    currentPageIndex: 0,
    annotations: {},              // `${sessionId}_${pageIndex}` -> { modelA: [...], modelB: [...] }
    annotationMessageIds: {},     // `${sessionId}_${pageIndex}` -> { modelA: messageId, modelB: messageId }
    annotationHistory: {},        // sessionId -> { modelA: [[...snapshots]], modelB: [[...]] }
    annotationFuture: {},         // sessionId -> { modelA: [[...]], modelB: [[...]] }
    activeAnnotationId: null,     // hover sync: box <-> card
    selectedAnnotationId: null,   // click-select for resize/move
    zoomLevel: 1.0,
    editedAnnotations: {},        // sessionId -> { modelA: {...id: annotation}, modelB: {...} }
    processingStatus: 'idle',     // 'idle'|'uploading'|'processing'|'done'|'error'
    processingError: null,
    canvasMode: 'select',         // 'select' | 'draw'
    drawType: 'paragraph',        // default type for newly drawn boxes
    activeCompareTab: 'modelA',   // which model's cards to show in compare mode
  },
  reducers: {
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
    },
    setPages: (state, action) => {
      state.pages = action.payload;
      state.currentPageIndex = 0;
    },
    setCurrentPageIndex: (state, action) => {
      state.currentPageIndex = action.payload;
      state.selectedAnnotationId = null;
      state.activeAnnotationId = null;
    },
    setAnnotations: (state, action) => {
      const { sessionId, participant, annotations, messageId } = action.payload;
      if (!state.annotations[sessionId]) {
        state.annotations[sessionId] = { modelA: [], modelB: [] };
      }
      state.annotations[sessionId][participant] = annotations;
      // Store message ID for save functionality
      if (messageId) {
        if (!state.annotationMessageIds[sessionId]) state.annotationMessageIds[sessionId] = {};
        state.annotationMessageIds[sessionId][participant] = messageId;
      }
      // Initialize editedAnnotations as a copy
      if (!state.editedAnnotations[sessionId]) {
        state.editedAnnotations[sessionId] = { modelA: {}, modelB: {} };
      }
      const byId = {};
      annotations.forEach(ann => { byId[ann.id] = { ...ann }; });
      state.editedAnnotations[sessionId][participant] = byId;
    },
    setActiveAnnotationId: (state, action) => {
      state.activeAnnotationId = action.payload;
    },
    setSelectedAnnotationId: (state, action) => {
      state.selectedAnnotationId = action.payload;
    },
    setZoomLevel: (state, action) => {
      state.zoomLevel = Math.min(3.0, Math.max(0.25, action.payload));
    },
    setProcessingStatus: (state, action) => {
      state.processingStatus = action.payload;
      if (action.payload !== 'error') state.processingError = null;
    },
    setProcessingError: (state, action) => {
      state.processingStatus = 'error';
      state.processingError = action.payload;
    },
    setCanvasMode: (state, action) => {
      state.canvasMode = action.payload;
    },
    setDrawType: (state, action) => {
      state.drawType = action.payload;
    },
    setActiveCompareTab: (state, action) => {
      state.activeCompareTab = action.payload;
    },
    setSelectedMode: (state, action) => {
      state.selectedMode = action.payload;
    },
    setSelectedModels: (state, action) => {
      state.selectedModels = action.payload;
    },

    updateAnnotationText: (state, action) => {
      const { sessionId, participant, annotationId, text } = action.payload;
      pushHistory(state, sessionId, participant);
      if (state.editedAnnotations[sessionId]?.[participant]?.[annotationId]) {
        state.editedAnnotations[sessionId][participant][annotationId].text = text;
      }
      const arr = state.annotations[sessionId]?.[participant];
      if (arr) {
        const item = arr.find(a => a.id === annotationId);
        if (item) item.text = text;
      }
    },
    updateAnnotationType: (state, action) => {
      const { sessionId, participant, annotationId, type } = action.payload;
      pushHistory(state, sessionId, participant);
      if (state.editedAnnotations[sessionId]?.[participant]?.[annotationId]) {
        state.editedAnnotations[sessionId][participant][annotationId].type = type;
      }
      const arr = state.annotations[sessionId]?.[participant];
      if (arr) {
        const item = arr.find(a => a.id === annotationId);
        if (item) item.type = type;
      }
    },
    updateAnnotationBox: (state, action) => {
      const { sessionId, participant, annotationId, box } = action.payload;
      pushHistory(state, sessionId, participant);
      if (state.editedAnnotations[sessionId]?.[participant]?.[annotationId]) {
        state.editedAnnotations[sessionId][participant][annotationId].box = box;
      }
      const arr = state.annotations[sessionId]?.[participant];
      if (arr) {
        const item = arr.find(a => a.id === annotationId);
        if (item) item.box = box;
      }
    },
    deleteAnnotation: (state, action) => {
      const { sessionId, participant, annotationId } = action.payload;
      pushHistory(state, sessionId, participant);
      if (state.annotations[sessionId]?.[participant]) {
        state.annotations[sessionId][participant] = state.annotations[sessionId][participant].filter(
          a => a.id !== annotationId
        );
      }
      if (state.editedAnnotations[sessionId]?.[participant]) {
        delete state.editedAnnotations[sessionId][participant][annotationId];
      }
      if (state.selectedAnnotationId === annotationId) state.selectedAnnotationId = null;
      if (state.activeAnnotationId === annotationId) state.activeAnnotationId = null;
    },
    duplicateAnnotation: (state, action) => {
      const { sessionId, participant, annotationId } = action.payload;
      const arr = state.annotations[sessionId]?.[participant];
      if (!arr) return;
      const original = arr.find(a => a.id === annotationId);
      if (!original) return;
      pushHistory(state, sessionId, participant);
      const newId = `r${uuidv4().slice(0, 8)}`;
      const clone = {
        ...original,
        id: newId,
        box: [original.box[0] + 10, original.box[1] + 10, original.box[2] + 10, original.box[3] + 10],
      };
      arr.push(clone);
      if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {}, modelB: {} };
      if (!state.editedAnnotations[sessionId][participant]) state.editedAnnotations[sessionId][participant] = {};
      state.editedAnnotations[sessionId][participant][newId] = { ...clone };
    },
    addAnnotation: (state, action) => {
      const { sessionId, participant, annotation } = action.payload;
      pushHistory(state, sessionId, participant);
      if (!state.annotations[sessionId]) state.annotations[sessionId] = { modelA: [], modelB: [] };
      if (!state.annotations[sessionId][participant]) state.annotations[sessionId][participant] = [];
      state.annotations[sessionId][participant].push(annotation);
      if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {}, modelB: {} };
      if (!state.editedAnnotations[sessionId][participant]) state.editedAnnotations[sessionId][participant] = {};
      state.editedAnnotations[sessionId][participant][annotation.id] = { ...annotation };
    },

    // Append a single annotation from the OCR stream — no history push
    streamAnnotation: (state, action) => {
      const { sessionId, participant, annotation } = action.payload;
      if (!state.annotations[sessionId]) state.annotations[sessionId] = { modelA: [], modelB: [] };
      if (!state.annotations[sessionId][participant]) state.annotations[sessionId][participant] = [];
      state.annotations[sessionId][participant].push(annotation);
      if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {}, modelB: {} };
      if (!state.editedAnnotations[sessionId][participant]) state.editedAnnotations[sessionId][participant] = {};
      state.editedAnnotations[sessionId][participant][annotation.id] = { ...annotation };
    },

    setAnnotationMessageId: (state, action) => {
      const { sessionId, participant, messageId } = action.payload;
      if (!state.annotationMessageIds[sessionId]) state.annotationMessageIds[sessionId] = {};
      state.annotationMessageIds[sessionId][participant] = messageId;
    },

    reorderAnnotations: (state, action) => {
      const { sessionId, participant, fromIndex, toIndex } = action.payload;
      const arr = state.annotations[sessionId]?.[participant];
      if (!arr || fromIndex === toIndex) return;
      pushHistory(state, sessionId, participant);
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
    },

    undoAnnotation: (state, action) => {
      const { sessionId, participant } = action.payload;
      ensureHistory(state, sessionId, participant);
      const history = state.annotationHistory[sessionId][participant];
      if (!history.length) return;
      const current = state.annotations[sessionId]?.[participant] || [];
      state.annotationFuture[sessionId][participant].push(current.map(a => ({ ...a, box: [...a.box] })));
      state.annotations[sessionId][participant] = history.pop();
      syncEdited(state, sessionId, participant);
      state.selectedAnnotationId = null;
    },
    redoAnnotation: (state, action) => {
      const { sessionId, participant } = action.payload;
      ensureHistory(state, sessionId, participant);
      const future = state.annotationFuture[sessionId][participant];
      if (!future.length) return;
      const current = state.annotations[sessionId]?.[participant] || [];
      state.annotationHistory[sessionId][participant].push(current.map(a => ({ ...a, box: [...a.box] })));
      state.annotations[sessionId][participant] = future.pop();
      syncEdited(state, sessionId, participant);
      state.selectedAnnotationId = null;
    },

    updateSessionTitle: (state, action) => {
      const { sessionId, title } = action.payload;
      const idx = state.sessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) state.sessions[idx].title = title;
      if (state.activeSession?.id === sessionId) state.activeSession.title = title;
    },
    updateActiveSessionData: (state, action) => {
      const updated = action.payload;
      if (state.activeSession?.id === updated.id) {
        state.activeSession = { ...state.activeSession, ...updated };
      }
      const idx = state.sessions.findIndex(s => s.id === updated.id);
      if (idx !== -1) state.sessions[idx] = { ...state.sessions[idx], ...updated };
    },

    clearOcrState: (state) => {
      state.pages = [];
      state.currentPageIndex = 0;
      state.activeAnnotationId = null;
      state.selectedAnnotationId = null;
      state.zoomLevel = 1.0;
      state.processingStatus = 'idle';
      state.processingError = null;
      state.canvasMode = 'select';
      state.activeCompareTab = 'modelA';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSession.fulfilled, (state, action) => {
        const session = action.payload;
        state.activeSession = session;
        state.messages[session.id] = [];
        if (!state.annotations[session.id]) state.annotations[session.id] = { modelA: [], modelB: [] };
        state.sessions.unshift({
          id: session.id,
          mode: session.mode,
          title: session.title,
          model_a_name: session.model_a?.display_name || 'Model A',
          model_b_name: session.model_b?.display_name || 'Model B',
          created_at: session.created_at,
          updated_at: session.updated_at,
          message_count: 0,
        });
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        const { session, messages } = action.payload;
        state.activeSession = session;
        const exists = state.sessions.find(s => s.id === session.id);
        if (!exists) state.sessions.unshift(session);
        if (!state.messages[session.id]) state.messages[session.id] = messages;

        if (messages) {
          // Restore pages — one entry per user message (sorted by creation order)
          const userMessages = [...messages.filter(m => m.role === 'user')]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          if (userMessages.length > 0) {
            state.pages = userMessages.map(m => ({
              path: m.image_path,
              url: m.temp_image_url || null,
              width: null,
              height: null,
            }));
            state.currentPageIndex = 0;
          }

          // Build userMessageId → pageIndex map for annotation restoration
          const userMsgToPage = {};
          userMessages.forEach((m, idx) => { userMsgToPage[m.id] = idx; });

          // Restore annotations keyed by `${sessionId}_${pageIndex}`
          messages.forEach(msg => {
            if (msg.role !== 'assistant' || !msg.content) return;
            let ocr_result = null;
            try { ocr_result = JSON.parse(msg.content); } catch (_) {}
            if (!Array.isArray(ocr_result) || ocr_result.length === 0) return;

            const parentId = msg.parent_message_ids?.[0];
            const pageIndex = parentId !== undefined ? (userMsgToPage[parentId] ?? 0) : 0;
            const pageKey = `${session.id}_${pageIndex}`;
            const participant = msg.participant === 'b' ? 'modelB' : 'modelA';

            if (!state.annotations[pageKey]) state.annotations[pageKey] = { modelA: [], modelB: [] };
            state.annotations[pageKey][participant] = ocr_result;

            if (!state.annotationMessageIds[pageKey]) state.annotationMessageIds[pageKey] = {};
            state.annotationMessageIds[pageKey][participant] = msg.id;

            if (!state.editedAnnotations[pageKey]) state.editedAnnotations[pageKey] = { modelA: {}, modelB: {} };
            if (!state.editedAnnotations[pageKey][participant]) state.editedAnnotations[pageKey][participant] = {};
            ocr_result.forEach(ann => {
              state.editedAnnotations[pageKey][participant][ann.id] = { ...ann };
            });
          });
        }

        // Mark as done so OcrWindow shows the document view instead of the upload screen
        const hasOcrData = messages?.some(m => {
          if (m.role !== 'assistant' || !m.content) return false;
          try { const p = JSON.parse(m.content); return Array.isArray(p) && p.length > 0; } catch (_) { return false; }
        });
        if (hasOcrData) state.processingStatus = 'done';
      })
      .addCase(togglePinSession.pending, (state, action) => {
        const { sessionId, isPinned } = action.meta.arg;
        const s = state.sessions.find(s => s.id === sessionId);
        if (s) s.is_pinned = isPinned;
      })
      .addCase(togglePinSession.fulfilled, (state, action) => {
        const idx = state.sessions.findIndex(s => s.id === action.payload.id);
        if (idx !== -1) state.sessions[idx] = { ...state.sessions[idx], ...action.payload };
      })
      .addCase(togglePinSession.rejected, (state, action) => {
        const { sessionId, isPinned } = action.meta.arg;
        const s = state.sessions.find(s => s.id === sessionId);
        if (s) s.is_pinned = !isPinned;
      })
      .addCase(renameSession.fulfilled, (state, action) => {
        const { id, title } = action.payload;
        const idx = state.sessions.findIndex(s => s.id === id);
        if (idx !== -1) state.sessions[idx].title = title;
        if (state.activeSession?.id === id) state.activeSession.title = title;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        const sessionId = action.payload;
        state.sessions = state.sessions.filter(s => s.id !== sessionId);
        if (state.activeSession?.id === sessionId) state.activeSession = null;
      });
  },
});

export const {
  setActiveSession, setPages, setCurrentPageIndex, setAnnotations,
  setActiveAnnotationId, setSelectedAnnotationId,
  setZoomLevel, setProcessingStatus, setProcessingError,
  setCanvasMode, setDrawType, setActiveCompareTab,
  setSelectedMode, setSelectedModels,
  updateAnnotationText, updateAnnotationType, updateAnnotationBox,
  deleteAnnotation, duplicateAnnotation, addAnnotation,
  streamAnnotation, setAnnotationMessageId, reorderAnnotations,
  undoAnnotation, redoAnnotation,
  updateSessionTitle, updateActiveSessionData, clearOcrState,
} = chatSlice.actions;

export default chatSlice.reducer;
