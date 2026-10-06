import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { breakdownTotal, clampMarks, DEFAULT_MAX_MARKS } from '../utils/evaluationCategories';

/*
 * Answer-evaluation state. Annotations are stored per page under `${sessionId}_${pageIndex}`,
 * one flat list per page mixing `kind: 'answer'` and `kind: 'finding'` items
 * (findings point at their answer through `answer_id`), exactly as the backend streams
 * and persists them in the page's assistant message.
 */

export const pageKeyOf = (sessionId, pageIndex) => `${sessionId}_${pageIndex}`;

// Evaluation models are kept here rather than in the shared `models` slice, which every
// arena overwrites with its own list (an in-flight OCR fetch could replace them).
export const fetchEvalModels = createAsyncThunk('evaluation/fetchModels', async (tenant) => {
  const url = tenant ? `/${tenant}${endpoints.models.list_eval}` : endpoints.models.list_eval;
  const response = await apiClient.get(url);
  return response.data;
});

export const fetchEvalSessions = createAsyncThunk('evaluation/fetchSessions', async () => {
  const response = await apiClient.get(endpoints.sessions.list_eval);
  return response.data;
});

export const fetchEvalSessionById = createAsyncThunk('evaluation/fetchSessionById', async (sessionId) => {
  const response = await apiClient.get(endpoints.sessions.detail(sessionId));
  return response.data;
});

export const createEvalSession = createAsyncThunk('evaluation/createSession', async ({ modelId, metadata }) => {
  const response = await apiClient.post(endpoints.sessions.create, {
    mode: 'direct',
    model_a_id: modelId,
    session_type: 'EVAL',
    metadata,
  });
  return response.data;
});

export const deleteEvalSession = createAsyncThunk('evaluation/deleteSession', async (sessionId) => {
  await apiClient.delete(endpoints.sessions.detail(sessionId));
  return sessionId;
});

/** Undo the latest re-evaluation of a page (the server restores what it replaced). */
export const revertRevision = createAsyncThunk('evaluation/revertRevision', async ({ messageId, revisionId, pageKey, turnId }) => {
  const response = await apiClient.post(endpoints.messages.revertRevision(messageId), { revision_id: revisionId });
  return { pageKey, turnId, annotations: response.data.annotations };
});

/** Persist every page with unsaved edits. */
export const saveEvaluation = createAsyncThunk('evaluation/save', async (_, { getState }) => {
  const { annotations, messageIds, dirty } = getState().evaluation;
  const saved = [];
  for (const pageKey of Object.keys(dirty).filter(k => dirty[k])) {
    const messageId = messageIds[pageKey];
    if (!messageId) continue;
    await apiClient.patch(endpoints.messages.saveAnnotations(messageId), {
      ocr_result: annotations[pageKey] || [],
    });
    saved.push(pageKey);
  }
  return saved;
});

/**
 * Chat transcript from the revision records the backend keeps on each page message.
 * One teacher turn per request (batch); one model turn per page it re-evaluated.
 */
function turnsFromMessages(messages, pageOfMessage) {
  const teacher = {};
  const model = [];
  messages.forEach(msg => {
    (msg.metadata?.eval_revisions || []).forEach(r => {
      const batchId = r.batch_id || r.id;
      const pageIndex = pageOfMessage[msg.id] ?? 0;
      const createdAt = r.created_at;
      if (!teacher[batchId] || createdAt < teacher[batchId].createdAt) {
        teacher[batchId] = {
          id: `t-${batchId}`, role: 'teacher', batchId, scope: r.scope, answerId: r.answer_id,
          question: r.question, pageIndex, text: r.prompt, createdAt,
        };
      }
      model.push({
        id: r.id, role: 'model', batchId, scope: r.scope, answerId: r.answer_id, question: r.question,
        pageIndex, messageId: msg.id, text: r.reply, status: r.status === 'reverted' ? 'reverted' : 'done',
        revisionId: r.id, scoreBefore: r.score_before, scoreAfter: r.score_after, createdAt,
      });
    });
  });
  const order = t => `${t.createdAt}${t.role === 'teacher' ? '0' : '1'}`;
  return [...Object.values(teacher), ...model].sort((a, b) => (order(a) < order(b) ? -1 : 1));
}

function markDirty(state, pageKey) {
  state.dirty[pageKey] = true;
}

function findItem(state, pageKey, id) {
  return (state.annotations[pageKey] || []).find(a => a.id === id);
}

const initialView = () => ({
  pages: [],
  currentPageIndex: 0,
  annotations: {},
  messageIds: {},
  dirty: {},
  pageStatus: {},
  pageErrors: {},
  selectedId: null,
  tool: 'select',        // 'select' | 'answer' | 'finding'
  drawAnswerId: null,    // answer a newly drawn finding is attached to
  zoom: 1,
  panelTab: 'evaluation', // 'evaluation' | 'chat'
  chatTurns: [],
  chatBusy: false,
  chatScope: null,        // { scope, answerId } preset by "Re-evaluate" on an answer card
  processingStatus: 'idle', // idle | uploading | processing | streaming | done | loading | error
  processingError: null,
  saveStatus: 'idle',
});

const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState: {
    sessions: [],
    activeSession: null,
    models: [],
    modelsLoading: false,
    selectedModelId: null,
    ...initialView(),
  },
  reducers: {
    clearEvaluation: (state) => {
      Object.assign(state, initialView(), { activeSession: null });
    },
    setSelectedModelId: (state, action) => { state.selectedModelId = action.payload; },
    setPages: (state, action) => { state.pages = action.payload; },
    setCurrentPageIndex: (state, action) => {
      state.currentPageIndex = action.payload;
      state.selectedId = null;
    },
    setProcessingStatus: (state, action) => {
      state.processingStatus = action.payload;
      if (action.payload !== 'error') state.processingError = null;
    },
    setProcessingError: (state, action) => {
      state.processingStatus = 'error';
      state.processingError = action.payload;
    },
    setPageStatus: (state, action) => {
      const { pageKey, status, error } = action.payload;
      state.pageStatus[pageKey] = status;
      if (error) state.pageErrors[pageKey] = error;
    },
    setMessageId: (state, action) => {
      const { pageKey, messageId } = action.payload;
      state.messageIds[pageKey] = messageId;
    },
    streamItem: (state, action) => {
      const { pageKey, item } = action.payload;
      if (!state.annotations[pageKey]) state.annotations[pageKey] = [];
      state.annotations[pageKey].push(item);
    },
    setSelectedId: (state, action) => { state.selectedId = action.payload; },
    setTool: (state, action) => {
      const { tool, answerId = null } = typeof action.payload === 'string' ? { tool: action.payload } : action.payload;
      state.tool = tool;
      state.drawAnswerId = tool === 'finding' ? answerId : null;
    },
    setZoom: (state, action) => { state.zoom = Math.min(3, Math.max(0.4, action.payload)); },

    updateItem: (state, action) => {
      const { pageKey, id, changes } = action.payload;
      const item = findItem(state, pageKey, id);
      if (!item) return;
      Object.assign(item, changes);
      if (item.kind === 'answer' && changes.marks_breakdown) {
        // Editing a criterion re-totals the answer.
        item.marks_awarded = clampMarks(breakdownTotal(item.marks_breakdown), 0, item.max_marks);
      }
      markDirty(state, pageKey);
    },
    addItem: (state, action) => {
      const { pageKey, item } = action.payload;
      if (!state.annotations[pageKey]) state.annotations[pageKey] = [];
      state.annotations[pageKey].push(item);
      state.selectedId = item.id;
      state.tool = 'select';
      state.drawAnswerId = null;
      markDirty(state, pageKey);
    },
    deleteItem: (state, action) => {
      const { pageKey, id } = action.payload;
      const list = state.annotations[pageKey] || [];
      const target = list.find(a => a.id === id);
      if (!target) return;
      // Deleting an answer removes the findings that belong to it.
      state.annotations[pageKey] = list.filter(a => a.id !== id && !(target.kind === 'answer' && a.answer_id === id));
      if (state.selectedId === id) state.selectedId = null;
      markDirty(state, pageKey);
    },
    setPanelTab: (state, action) => { state.panelTab = action.payload; },
    setChatScope: (state, action) => { state.chatScope = action.payload; },
    setChatBusy: (state, action) => { state.chatBusy = action.payload; },
    addTurn: (state, action) => { state.chatTurns.push(action.payload); },
    updateTurn: (state, action) => {
      const turn = state.chatTurns.find(t => t.id === action.payload.id);
      if (turn) Object.assign(turn, action.payload.changes);
    },
    /** A re-evaluated page from the server: it is now saved, so it is no longer dirty. */
    replacePageAnnotations: (state, action) => {
      const { pageKey, items } = action.payload;
      state.annotations[pageKey] = items;
      delete state.dirty[pageKey];
      if (state.selectedId && !items.some(i => i.id === state.selectedId)) state.selectedId = null;
    },
    updateSessionTitle: (state, action) => {
      const { sessionId, title } = action.payload;
      const s = state.sessions.find(x => x.id === sessionId);
      if (s) s.title = title;
      if (state.activeSession?.id === sessionId) state.activeSession.title = title;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvalModels.pending, (state) => { state.modelsLoading = true; })
      .addCase(fetchEvalModels.rejected, (state) => { state.modelsLoading = false; })
      .addCase(fetchEvalModels.fulfilled, (state, action) => {
        state.modelsLoading = false;
        state.models = Array.isArray(action.payload) ? action.payload : action.payload?.results || [];
      })
      .addCase(fetchEvalSessions.fulfilled, (state, action) => {
        state.sessions = Array.isArray(action.payload) ? action.payload : action.payload?.results || [];
      })
      .addCase(createEvalSession.fulfilled, (state, action) => {
        const session = action.payload;
        state.activeSession = session;
        state.sessions.unshift({ id: session.id, title: session.title, created_at: session.created_at });
      })
      .addCase(fetchEvalSessionById.pending, (state) => {
        state.processingStatus = 'loading';
        state.processingError = null;
      })
      .addCase(fetchEvalSessionById.rejected, (state, action) => {
        state.processingStatus = 'error';
        state.processingError = action.error?.message || 'Failed to load evaluation.';
      })
      .addCase(fetchEvalSessionById.fulfilled, (state, action) => {
        const { session, messages = [] } = action.payload;
        Object.assign(state, initialView());
        state.activeSession = session;
        if (!state.sessions.some(s => s.id === session.id)) state.sessions.unshift(session);

        const userMessages = messages.filter(m => m.role === 'user')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const dims = session.metadata?.page_dimensions || [];
        state.pages = userMessages.map((m, i) => ({
          path: m.image_path,
          url: m.temp_image_url || null,
          width: dims[i]?.width || null,
          height: dims[i]?.height || null,
        }));
        const pageOfUserMessage = Object.fromEntries(userMessages.map((m, i) => [m.id, i]));

        messages.filter(m => m.role === 'assistant').forEach(msg => {
          const pageIndex = pageOfUserMessage[msg.parent_message_ids?.[0]] ?? 0;
          const pageKey = pageKeyOf(session.id, pageIndex);
          let items = [];
          try { items = JSON.parse(msg.content || '[]'); } catch (_) { items = []; }
          state.annotations[pageKey] = Array.isArray(items) ? items : [];
          state.messageIds[pageKey] = msg.id;
          state.pageStatus[pageKey] = msg.status === 'error' ? 'error' : 'done';
        });
        const pageOfMessage = {};
        messages.filter(m => m.role === 'assistant').forEach(m => {
          pageOfMessage[m.id] = pageOfUserMessage[m.parent_message_ids?.[0]] ?? 0;
        });
        state.chatTurns = turnsFromMessages(messages.filter(m => m.role === 'assistant'), pageOfMessage);
        state.processingStatus = state.pages.length ? 'done' : 'idle';
      })
      .addCase(deleteEvalSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        if (state.activeSession?.id === action.payload) Object.assign(state, initialView(), { activeSession: null });
      })
      .addCase(revertRevision.fulfilled, (state, action) => {
        const { pageKey, turnId, annotations } = action.payload;
        state.annotations[pageKey] = annotations;
        delete state.dirty[pageKey];
        state.selectedId = null;
        const turn = state.chatTurns.find(t => t.id === turnId);
        if (turn) turn.status = 'reverted';
      })
      .addCase(saveEvaluation.pending, (state) => { state.saveStatus = 'saving'; })
      .addCase(saveEvaluation.fulfilled, (state, action) => {
        action.payload.forEach(pageKey => { delete state.dirty[pageKey]; });
        state.saveStatus = 'saved';
      })
      .addCase(saveEvaluation.rejected, (state) => { state.saveStatus = 'error'; });
  },
});

export const {
  clearEvaluation, setSelectedModelId, setPages, setCurrentPageIndex,
  setProcessingStatus, setProcessingError, setPageStatus, setMessageId, streamItem,
  setSelectedId, setTool, setZoom, updateItem, addItem, deleteItem, updateSessionTitle,
  setPanelTab, setChatScope, setChatBusy, addTurn, updateTurn, replacePageAnnotations,
} = evaluationSlice.actions;

export const selectMaxMarks = (state) =>
  Number(state.evaluation.activeSession?.metadata?.max_marks) || DEFAULT_MAX_MARKS;

export default evaluationSlice.reducer;
