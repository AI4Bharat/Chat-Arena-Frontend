import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { v4 as uuidv4 } from 'uuid';

// ── Undo/Redo helpers ────────────────────────────────────────────────────────
const MAX_HISTORY = 50;

function ensureHistory(state, sessionId, participant) {
  if (!state.annotationHistory[sessionId]) state.annotationHistory[sessionId] = { modelA: [] };
  if (!state.annotationFuture[sessionId])  state.annotationFuture[sessionId]  = { modelA: [] };
}

function pushHistory(state, sessionId, participant) {
  ensureHistory(state, sessionId, participant);
  const current = state.annotations[sessionId]?.[participant] || [];
  const stack = state.annotationHistory[sessionId][participant] || [];
  state.annotationHistory[sessionId][participant] = stack;
  stack.push(current.map(a => ({ ...a, box: [...a.box] })));
  if (stack.length > MAX_HISTORY) stack.shift();
  state.annotationFuture[sessionId][participant] = [];
}

function syncEdited(state, sessionId, participant) {
  const arr = state.annotations[sessionId]?.[participant] || [];
  if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {} };
  const byId = {};
  arr.forEach(a => { byId[a.id] = { ...a }; });
  state.editedAnnotations[sessionId][participant] = byId;
}

// ── Async thunks ─────────────────────────────────────────────────────────────
export const createEduvizSession = createAsyncThunk(
  'eduviz/createSession',
  async ({ mode, modelA, type, metadata }) => {
    const response = await apiClient.post(endpoints.sessions.create, {
      mode,
      model_a_id: modelA,
      session_type: type,
      ...(metadata && { metadata }),
    });
    return response.data;
  }
);

export const fetchEduvizSessions = createAsyncThunk(
  'eduviz/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_eduviz);
    return response.data;
  }
);

export const fetchEduvizSessionById = createAsyncThunk(
  'eduviz/fetchSessionById',
  async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/`);
    return response.data;
  }
);

export const renameEduvizSession = createAsyncThunk(
  'eduviz/renameSession',
  async ({ sessionId, title }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, { title });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteEduvizSession = createAsyncThunk(
  'eduviz/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/`);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const togglePinEduvizSession = createAsyncThunk(
  'eduviz/togglePinSession',
  async ({ sessionId, isPinned }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/sessions/${sessionId}/`, { is_pinned: isPinned });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const submitAssessment = createAsyncThunk(
  'eduviz/submitAssessment',
  async ({ messageId, assessment }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(endpoints.messages.submitAssessment(messageId), { assessment });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const eduvizSlice = createSlice({
  name: 'eduviz',
  initialState: {
    sessions: [],
    activeSession: null,
    messages: {},
    loading: false,
    error: null,
    selectedModels: { modelA: null },

    // Document state
    pages: [],
    currentPageIndex: 0,
    annotations: {},
    annotationMessageIds: {},
    annotationHistory: {},
    annotationFuture: {},
    activeAnnotationId: null,
    selectedAnnotationId: null,
    zoomLevel: 1.0,
    editedAnnotations: {},
    processingStatus: 'idle',
    processingError: null,
    canvasMode: 'select',
    drawType: 'spelling_error',

    // Metadata state
    metadata: {
      grade: '',
      subject: '',
      taskType: '',
      language: '',
      script: '',
      writing: '',
    },

    submitStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
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
        state.annotations[sessionId] = { modelA: [] };
      }
      state.annotations[sessionId][participant] = annotations;
      if (messageId) {
        if (!state.annotationMessageIds[sessionId]) state.annotationMessageIds[sessionId] = {};
        state.annotationMessageIds[sessionId][participant] = messageId;
      }
      if (!state.editedAnnotations[sessionId]) {
        state.editedAnnotations[sessionId] = { modelA: {} };
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
    setSelectedModels: (state, action) => {
      state.selectedModels = action.payload;
    },

    setSubmitStatus: (state, action) => {
      state.submitStatus = action.payload;
    },

    // Metadata
    setMetadataField: (state, action) => {
      const { field, value } = action.payload;
      state.metadata[field] = value;
    },

    // Annotation editing
    snapshotAnnotations: (state, action) => {
      const { sessionId, participant } = action.payload;
      pushHistory(state, sessionId, participant);
    },
    updateAnnotationText: (state, action) => {
      const { sessionId, participant, annotationId, text } = action.payload;
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
    updateAnnotationAssessment: (state, action) => {
      const { sessionId, participant, annotationId, assessmentUpdate } = action.payload;
      
      const applyAssessment = (target) => {
        if (!target.assessment) {
          target.assessment = { whyIncorrect: '', suggestedImprovement: '', rubrics: { legibility: 0, spellingAccuracy: 0, contentCorrectness: 0 } };
        }
        if (assessmentUpdate.whyIncorrect !== undefined) target.assessment.whyIncorrect = assessmentUpdate.whyIncorrect;
        if (assessmentUpdate.suggestedImprovement !== undefined) target.assessment.suggestedImprovement = assessmentUpdate.suggestedImprovement;
        if (assessmentUpdate.rubrics) {
          target.assessment.rubrics = { ...target.assessment.rubrics, ...assessmentUpdate.rubrics };
        }
      };

      if (state.editedAnnotations[sessionId]?.[participant]?.[annotationId]) {
        applyAssessment(state.editedAnnotations[sessionId][participant][annotationId]);
      }
      const arr = state.annotations[sessionId]?.[participant];
      if (arr) {
        const item = arr.find(a => a.id === annotationId);
        if (item) applyAssessment(item);
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
    addAnnotation: (state, action) => {
      const { sessionId, participant, annotation } = action.payload;
      pushHistory(state, sessionId, participant);
      if (!state.annotations[sessionId]) state.annotations[sessionId] = { modelA: [] };
      if (!state.annotations[sessionId][participant]) state.annotations[sessionId][participant] = [];
      state.annotations[sessionId][participant].push(annotation);
      if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {} };
      if (!state.editedAnnotations[sessionId][participant]) state.editedAnnotations[sessionId][participant] = {};
      state.editedAnnotations[sessionId][participant][annotation.id] = { ...annotation };
    },
    streamAnnotation: (state, action) => {
      const { sessionId, participant, annotation } = action.payload;
      if (!state.annotations[sessionId]) state.annotations[sessionId] = { modelA: [] };
      if (!state.annotations[sessionId][participant]) state.annotations[sessionId][participant] = [];
      state.annotations[sessionId][participant].push(annotation);
      if (!state.editedAnnotations[sessionId]) state.editedAnnotations[sessionId] = { modelA: {} };
      if (!state.editedAnnotations[sessionId][participant]) state.editedAnnotations[sessionId][participant] = {};
      state.editedAnnotations[sessionId][participant][annotation.id] = { ...annotation };
    },
    setAnnotationMessageId: (state, action) => {
      const { sessionId, participant, messageId } = action.payload;
      if (!state.annotationMessageIds[sessionId]) state.annotationMessageIds[sessionId] = {};
      state.annotationMessageIds[sessionId][participant] = messageId;
    },
    undoAnnotation: (state, action) => {
      const { sessionId, participant } = action.payload;
      ensureHistory(state, sessionId, participant);
      const history = state.annotationHistory[sessionId][participant];
      if (!history || !history.length) return;
      const current = state.annotations[sessionId]?.[participant] || [];
      if (!state.annotationFuture[sessionId][participant]) state.annotationFuture[sessionId][participant] = [];
      state.annotationFuture[sessionId][participant].push(current.map(a => ({ ...a, box: [...a.box] })));
      state.annotations[sessionId][participant] = history.pop();
      syncEdited(state, sessionId, participant);
      state.selectedAnnotationId = null;
    },
    redoAnnotation: (state, action) => {
      const { sessionId, participant } = action.payload;
      ensureHistory(state, sessionId, participant);
      const future = state.annotationFuture[sessionId][participant];
      if (!future || !future.length) return;
      const current = state.annotations[sessionId]?.[participant] || [];
      if (!state.annotationHistory[sessionId][participant]) state.annotationHistory[sessionId][participant] = [];
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
    clearEduvizState: (state) => {
      state.pages = [];
      state.currentPageIndex = 0;
      state.activeAnnotationId = null;
      state.selectedAnnotationId = null;
      state.zoomLevel = 1.0;
      state.processingStatus = 'idle';
      state.processingError = null;
      state.canvasMode = 'select';
      state.drawType = 'spelling_error';
      state.metadata = {
        grade: '',
        subject: '',
        taskType: '',
        language: '',
        script: '',
        writing: '',
      };
      state.submitStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEduvizSession.fulfilled, (state, action) => {
        const session = action.payload;
        state.activeSession = session;
        state.messages[session.id] = [];
        if (!state.annotations[session.id]) state.annotations[session.id] = { modelA: [] };
        state.sessions.unshift({
          id: session.id,
          mode: session.mode,
          title: session.title,
          model_a_name: session.model_a?.display_name || 'Model A',
          created_at: session.created_at,
          updated_at: session.updated_at,
          message_count: 0,
        });
      })
      .addCase(fetchEduvizSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(fetchEduvizSessionById.pending, (state) => {
        state.processingStatus = 'loading';
        state.processingError = null;
      })
      .addCase(fetchEduvizSessionById.rejected, (state, action) => {
        state.processingStatus = 'error';
        state.processingError = action.error?.message || 'Failed to load session.';
      })
      .addCase(fetchEduvizSessionById.fulfilled, (state, action) => {
        const { session, messages } = action.payload;
        state.activeSession = session;
        const exists = state.sessions.find(s => s.id === session.id);
        if (!exists) state.sessions.unshift(session);
        if (!state.messages[session.id]) state.messages[session.id] = messages;

        if (messages) {
          const userMessages = [...messages.filter(m => m.role === 'user')]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          if (userMessages.length > 0) {
            const pageDims = session.metadata?.page_dimensions || [];
            state.pages = userMessages.map((m, i) => ({
              path: m.image_path,
              url: m.temp_image_url || null,
              width: pageDims[i]?.width || null,
              height: pageDims[i]?.height || null,
            }));
            state.currentPageIndex = 0;
          }

          const userMsgToPage = {};
          userMessages.forEach((m, idx) => { userMsgToPage[m.id] = idx; });

          messages.forEach(msg => {
            if (msg.role !== 'assistant' || !msg.content) return;
            let ocr_result = null;
            try { ocr_result = JSON.parse(msg.content); } catch (_) {}
            if (!Array.isArray(ocr_result) || ocr_result.length === 0) return;

            const parentId = msg.parent_message_ids?.[0];
            const pageIndex = parentId !== undefined ? (userMsgToPage[parentId] ?? 0) : 0;
            const pageKey = `${session.id}_${pageIndex}`;
            const participant = 'modelA';

            if (!state.annotations[pageKey]) state.annotations[pageKey] = { modelA: [] };
            state.annotations[pageKey][participant] = ocr_result;

            if (!state.annotationMessageIds[pageKey]) state.annotationMessageIds[pageKey] = {};
            state.annotationMessageIds[pageKey][participant] = msg.id;

            if (!state.editedAnnotations[pageKey]) state.editedAnnotations[pageKey] = { modelA: {} };
            if (!state.editedAnnotations[pageKey][participant]) state.editedAnnotations[pageKey][participant] = {};
            ocr_result.forEach(ann => {
              state.editedAnnotations[pageKey][participant][ann.id] = { ...ann };
            });
          });

          state.metadata = {
            grade: '',
            subject: '',
            taskType: '',
            language: '',
            script: '',
            writing: '',
          };

          // Restore assessment from metadata if available
          const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
          if (lastAssistant?.metadata?.eduviz_assessment) {
            const saved = lastAssistant.metadata.eduviz_assessment;
            
            if (saved.metadata) {
              state.metadata = {
                grade: saved.metadata.grade || '',
                subject: saved.metadata.subject || '',
                taskType: saved.metadata.taskType || '',
                language: saved.metadata.language || '',
                script: saved.metadata.script || '',
                writing: saved.metadata.writing || '',
              };
            }
            
            // If they saved full blocks (the new way via annotatedBlocks) or legacy errorBoxes
            const savedBlocks = (saved.annotatedBlocks && Array.isArray(saved.annotatedBlocks)) ? saved.annotatedBlocks : [];
            const legacyErrorBoxes = (saved.errorBoxes && Array.isArray(saved.errorBoxes)) ? saved.errorBoxes : [];
            const blocksToRestore = savedBlocks.length > 0 ? savedBlocks : legacyErrorBoxes;

            if (blocksToRestore.length > 0) {
              const parentId = lastAssistant.parent_message_ids?.[0];
              const pageIndex = parentId !== undefined ? (userMsgToPage[parentId] ?? 0) : 0;
              const pageKey = `${session.id}_${pageIndex}`;
              const participant = 'modelA';
              
              if (!state.annotations[pageKey]) state.annotations[pageKey] = { modelA: [] };
              if (!state.annotations[pageKey][participant]) state.annotations[pageKey][participant] = [];
              if (!state.editedAnnotations[pageKey]) state.editedAnnotations[pageKey] = { modelA: {} };
              if (!state.editedAnnotations[pageKey][participant]) state.editedAnnotations[pageKey][participant] = {};
              
              // Full replacement of matching blocks to ensure assessment fields populate
              blocksToRestore.forEach(savedBlock => {
                const existingIdx = state.annotations[pageKey][participant].findIndex(a => a.id === savedBlock.id);
                if (existingIdx >= 0) {
                  state.annotations[pageKey][participant][existingIdx] = { ...state.annotations[pageKey][participant][existingIdx], ...savedBlock };
                } else {
                  state.annotations[pageKey][participant].push(savedBlock);
                }
                state.editedAnnotations[pageKey][participant][savedBlock.id] = { 
                  ...state.editedAnnotations[pageKey][participant][savedBlock.id], 
                  ...savedBlock 
                };
              });
            }
          }
        }

        const hasOcrData = messages?.some(m => {
          if (m.role !== 'assistant' || !m.content) return false;
          try { const p = JSON.parse(m.content); return Array.isArray(p) && p.length > 0; } catch (_) { return false; }
        });
        state.processingStatus = hasOcrData ? 'done' : 'idle';
      })
      .addCase(togglePinEduvizSession.pending, (state, action) => {
        const { sessionId, isPinned } = action.meta.arg;
        const s = state.sessions.find(s => s.id === sessionId);
        if (s) s.is_pinned = isPinned;
      })
      .addCase(togglePinEduvizSession.fulfilled, (state, action) => {
        const idx = state.sessions.findIndex(s => s.id === action.payload.id);
        if (idx !== -1) state.sessions[idx] = { ...state.sessions[idx], ...action.payload };
      })
      .addCase(renameEduvizSession.fulfilled, (state, action) => {
        const { id, title } = action.payload;
        const idx = state.sessions.findIndex(s => s.id === id);
        if (idx !== -1) state.sessions[idx].title = title;
        if (state.activeSession?.id === id) state.activeSession.title = title;
      })
      .addCase(deleteEduvizSession.fulfilled, (state, action) => {
        const sessionId = action.payload;
        state.sessions = state.sessions.filter(s => s.id !== sessionId);
        if (state.activeSession?.id === sessionId) state.activeSession = null;
      })
      .addCase(submitAssessment.pending, (state) => {
        state.submitStatus = 'saving';
      })
      .addCase(submitAssessment.fulfilled, (state) => {
        state.submitStatus = 'saved';
      })
      .addCase(submitAssessment.rejected, (state) => {
        state.submitStatus = 'error';
      });
  },
});

export const {
  setActiveSession, setPages, setCurrentPageIndex, setAnnotations,
  setActiveAnnotationId, setSelectedAnnotationId,
  setZoomLevel, setProcessingStatus, setProcessingError,
  setCanvasMode, setDrawType, setSelectedModels,
  setSubmitStatus,
  setMetadataField,
  snapshotAnnotations,
  updateAnnotationText, updateAnnotationType, updateAnnotationBox, updateAnnotationAssessment,
  deleteAnnotation, addAnnotation, streamAnnotation, setAnnotationMessageId,
  undoAnnotation, redoAnnotation,
  updateSessionTitle, clearEduvizState,
} = eduvizSlice.actions;

export default eduvizSlice.reducer;
