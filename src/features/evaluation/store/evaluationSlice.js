import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { breakdownTotal, clampMarks, DEFAULT_MAX_MARKS } from '../utils/evaluationCategories';

/*
 * Answer-evaluation state. One evaluation covers the whole answer sheet: `items` is a flat
 * list mixing
 *   - answers  `{ kind: 'answer', id, question, ..., parts: [{ id, page, box }] }` — one per
 *     question, with one box ("part") per page the answer is on (many boxes -> one question);
 *   - findings `{ kind: 'finding', id, answer_id, page, box, ... }`.
 * Pages are numbered from 1 in `page` fields; `currentPageIndex` is 0-based.
 * It is stored in a single assistant message (`messageId`), exactly as the backend streams it.
 */

export const pageNumberOf = (pageIndex) => pageIndex + 1;
export const answerPages = (answer) => [...new Set((answer.parts || []).map(p => p.page))].sort((a, b) => a - b);

/** The answer / part / finding a selected id refers to (a part's answer comes along). */
export function resolveSelection(items, id) {
  if (!id) return {};
  for (const item of items) {
    if (item.id === id) return item.kind === 'answer' ? { answer: item } : { finding: item };
    const part = item.kind === 'answer' && (item.parts || []).find(p => p.id === id);
    if (part) return { answer: item, part };
  }
  return {};
}

/** The answer a selection belongs to (the finding's answer for a finding). */
export function selectedAnswerOf(items, id) {
  const { answer, finding } = resolveSelection(items, id);
  return answer || (finding && items.find(i => i.kind === 'answer' && i.id === finding.answer_id)) || null;
}

export function nextId(items, base) {
  const ids = new Set(items.flatMap(i => [i.id, ...(i.parts || []).map(p => p.id)]));
  let n = 1;
  while (ids.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export const fetchEvalSessions = createAsyncThunk('evaluation/fetchSessions', async () => {
  const response = await apiClient.get(endpoints.sessions.list_eval);
  return response.data;
});

// Evaluation models are kept here rather than in the shared `models` slice, which every
// arena overwrites with its own list (an in-flight OCR fetch could replace them).
export const fetchEvalModels = createAsyncThunk('evaluation/fetchModels', async (tenant) => {
  const url = tenant ? `/${tenant}${endpoints.models.list_eval}` : endpoints.models.list_eval;
  const response = await apiClient.get(url);
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

/** Undo the latest re-evaluation (the server restores what it replaced). */
export const revertRevision = createAsyncThunk('evaluation/revertRevision', async ({ messageId, revisionId, turnId }) => {
  const response = await apiClient.post(endpoints.messages.revertRevision(messageId), { revision_id: revisionId });
  return { turnId, annotations: response.data.annotations };
});

/** Persist the teacher's edits to the evaluation. */
export const saveEvaluation = createAsyncThunk('evaluation/save', async (_, { getState }) => {
  const { items, messageId } = getState().evaluation;
  await apiClient.patch(endpoints.messages.saveAnnotations(messageId), { ocr_result: items });
});

/** Chat transcript from the revision records the backend keeps on the evaluation message. */
function turnsFromRevisions(message) {
  const turns = [];
  (message?.metadata?.eval_revisions || []).forEach(r => {
    const base = { scope: r.scope, answerId: r.answer_id, question: r.question, page: r.page };
    turns.push({ ...base, id: `t-${r.id}`, role: 'teacher', text: r.prompt, createdAt: r.created_at });
    turns.push({
      ...base, id: r.id, role: 'model', messageId: message.id, text: r.reply,
      status: r.status === 'reverted' ? 'reverted' : 'done', revisionId: r.id,
      scoreBefore: r.score_before, scoreAfter: r.score_after, createdAt: r.created_at,
    });
  });
  return turns;
}

const sortParts = (parts) => [...parts].sort((a, b) => a.page - b.page || a.box[1] - b.box[1]);

const initialView = () => ({
  pages: [],
  currentPageIndex: 0,
  items: [],
  messageId: null,
  dirty: false,
  evalStatus: 'idle',      // idle | streaming | done | error  (the model run)
  evalError: null,
  evalProgress: null,      // latest progress note from the server ("Reading page 2 of 6 (OCR)…")
  selectedId: null,        // an answer, part or finding id
  tool: 'select',          // 'select' | 'answer' | 'part' | 'finding'
  drawAnswerId: null,      // answer a newly drawn part / finding is attached to
  zoom: 1,
  pageFilter: 'page',      // side panel: answers on this page | all answers
  chatOpen: false,         // chat pop-up over the side panel
  chatTurns: [],
  chatBusy: false,
  chatScope: null,         // { scope, answerId } preset by "Re-evaluate" on an answer card
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
    setEvalStatus: (state, action) => {
      state.evalStatus = action.payload.status;
      state.evalError = action.payload.error || null;
      state.evalProgress = null;
    },
    setEvalProgress: (state, action) => { state.evalProgress = action.payload; },
    setMessageId: (state, action) => { state.messageId = action.payload; },
    streamItem: (state, action) => { state.items.push(action.payload); },
    setSelectedId: (state, action) => { state.selectedId = action.payload; },
    setTool: (state, action) => {
      const { tool, answerId = null } = typeof action.payload === 'string' ? { tool: action.payload } : action.payload;
      state.tool = tool;
      state.drawAnswerId = tool === 'finding' || tool === 'part' ? answerId : null;
    },
    setZoom: (state, action) => { state.zoom = Math.min(3, Math.max(0.4, action.payload)); },
    setPageFilter: (state, action) => { state.pageFilter = action.payload; },

    /** Change an answer or finding. */
    updateItem: (state, action) => {
      const { id, changes } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      Object.assign(item, changes);
      if (item.kind === 'answer' && changes.marks_breakdown) {
        // Editing a criterion re-totals the answer.
        item.marks_awarded = clampMarks(breakdownTotal(item.marks_breakdown), 0, item.max_marks);
      }
      state.dirty = true;
    },
    /** Move / resize one of an answer's boxes. */
    updatePart: (state, action) => {
      const { partId, changes } = action.payload;
      const { part } = resolveSelection(state.items, partId);
      if (!part) return;
      Object.assign(part, changes);
      state.dirty = true;
    },
    addItem: (state, action) => {
      const item = action.payload;
      state.items.push(item);
      state.selectedId = item.kind === 'answer' ? (item.parts[0]?.id ?? item.id) : item.id;
      state.tool = 'select';
      state.drawAnswerId = null;
      state.dirty = true;
    },
    /** Another box for an existing answer, e.g. where it continues on the next page. */
    addPart: (state, action) => {
      const { answerId, page, box } = action.payload;
      const answer = state.items.find(i => i.kind === 'answer' && i.id === answerId);
      if (!answer) return;
      const part = { id: nextId(state.items, `${answerId}-p`), page, box };
      answer.parts = sortParts([...(answer.parts || []), part]);
      state.selectedId = part.id;
      state.tool = 'select';
      state.drawAnswerId = null;
      state.dirty = true;
    },
    /**
     * Re-label a box: make it part of another question (`toAnswerId`), or of a new question
     * (`toAnswerId: null`). An answer left with no boxes is merged into the target: its
     * findings move over and it is removed.
     */
    movePart: (state, action) => {
      const { partId, toAnswerId } = action.payload;
      const { answer: from, part } = resolveSelection(state.items, partId);
      if (!part) return;
      let to = toAnswerId ? state.items.find(i => i.kind === 'answer' && i.id === toAnswerId) : null;
      if (to && to.id === from.id) return;
      from.parts = from.parts.filter(p => p.id !== partId);
      if (!to) {
        const id = nextId(state.items, 'q');
        to = {
          id, kind: 'answer', question: `Q${id.slice(1)}`, question_text: '', parts: [],
          category: from.category, marks_awarded: 0, max_marks: from.max_marks, marks_breakdown: [], comment: '',
        };
        state.items.push(to);
        to = state.items[state.items.length - 1];
      }
      to.parts = sortParts([...(to.parts || []), part]);
      if (from.parts.length === 0) {
        state.items.forEach(i => { if (i.kind === 'finding' && i.answer_id === from.id) i.answer_id = to.id; });
        state.items = state.items.filter(i => i.id !== from.id);
      }
      state.selectedId = part.id;
      state.dirty = true;
    },
    /** Delete an answer (with its findings), a finding, or one box of an answer. */
    deleteItem: (state, action) => {
      const id = action.payload;
      const { answer, part, finding } = resolveSelection(state.items, id);
      if (part && answer.parts.length > 1) {
        answer.parts = answer.parts.filter(p => p.id !== id);
      } else if (answer) {
        const answerId = answer.id;
        state.items = state.items.filter(i => i.id !== answerId && i.answer_id !== answerId);
      } else if (finding) {
        state.items = state.items.filter(i => i.id !== id);
      } else {
        return;
      }
      if (state.selectedId === id) state.selectedId = null;
      state.dirty = true;
    },
    /** The sheet as re-evaluated and saved by the server. */
    replaceItems: (state, action) => {
      state.items = action.payload;
      state.dirty = false;
      const sel = resolveSelection(state.items, state.selectedId);
      if (!sel.answer && !sel.finding) state.selectedId = null;
    },
    setChatOpen: (state, action) => { state.chatOpen = action.payload; },
    setChatScope: (state, action) => { state.chatScope = action.payload; },
    setChatBusy: (state, action) => { state.chatBusy = action.payload; },
    addTurn: (state, action) => { state.chatTurns.push(action.payload); },
    updateTurn: (state, action) => {
      const turn = state.chatTurns.find(t => t.id === action.payload.id);
      if (turn) Object.assign(turn, action.payload.changes);
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

        const evaluations = messages.filter(m => m.role === 'assistant');
        if (evaluations.length > 1) {
          state.processingStatus = 'error';
          state.processingError = 'This evaluation was made by an earlier, page-by-page version. '
            + 'Start a new evaluation to get answers that span pages.';
          return;
        }
        const userMessages = messages.filter(m => m.role === 'user')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const recorded = Object.fromEntries((session.metadata?.answer_pages || []).map(p => [p.path, p]));
        state.pages = userMessages.map(m => ({
          path: m.image_path,
          url: m.temp_image_url || null,
          width: recorded[m.image_path]?.width || null,
          height: recorded[m.image_path]?.height || null,
        }));

        const evaluation = evaluations[0];
        if (evaluation) {
          let items = [];
          try { items = JSON.parse(evaluation.content || '[]'); } catch (_) { items = []; }
          state.items = Array.isArray(items) ? items : [];
          state.messageId = evaluation.id;
          state.evalStatus = evaluation.status === 'success' ? 'done' : 'error';
          if (evaluation.status !== 'success') state.evalError = 'The evaluation did not finish.';
          state.chatTurns = turnsFromRevisions(evaluation);
        }
        state.processingStatus = state.pages.length ? 'done' : 'idle';
      })
      .addCase(deleteEvalSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        if (state.activeSession?.id === action.payload) Object.assign(state, initialView(), { activeSession: null });
      })
      .addCase(revertRevision.fulfilled, (state, action) => {
        const { turnId, annotations } = action.payload;
        state.items = annotations;
        state.dirty = false;
        state.selectedId = null;
        const turn = state.chatTurns.find(t => t.id === turnId);
        if (turn) turn.status = 'reverted';
      })
      .addCase(saveEvaluation.pending, (state) => { state.saveStatus = 'saving'; })
      .addCase(saveEvaluation.fulfilled, (state) => {
        state.dirty = false;
        state.saveStatus = 'saved';
      })
      .addCase(saveEvaluation.rejected, (state) => { state.saveStatus = 'error'; });
  },
});

export const {
  clearEvaluation, setSelectedModelId, setPages, setCurrentPageIndex,
  setProcessingStatus, setProcessingError, setEvalStatus, setEvalProgress, setMessageId, streamItem,
  setSelectedId, setTool, setZoom, setPageFilter, updateItem, updatePart, addItem, addPart, movePart, deleteItem,
  replaceItems, setChatOpen, setChatScope, setChatBusy, addTurn, updateTurn, updateSessionTitle,
} = evaluationSlice.actions;

// Marks for a hand-drawn answer: the teacher's marks per question, or, when the marks came from
// the paper (max_marks null), the most common maximum among the model's answers.
export const selectMaxMarks = (state) => {
  const fixed = Number(state.evaluation.activeSession?.metadata?.max_marks);
  if (fixed > 0) return fixed;
  const counts = {};
  state.evaluation.items.forEach((i) => {
    if (i.kind === 'answer' && Number(i.max_marks) > 0) counts[i.max_marks] = (counts[i.max_marks] || 0) + 1;
  });
  const [common] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return Number(common) || DEFAULT_MAX_MARKS;
};

export default evaluationSlice.reducer;
