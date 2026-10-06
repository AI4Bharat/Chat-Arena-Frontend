import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  addTurn, pageKeyOf, replacePageAnnotations, setChatBusy, updateTurn,
} from '../store/evaluationSlice';

/**
 * Sends the teacher's feedback to the model and swaps in its revised evaluation.
 *
 * scope 'answer' revises one answer on the current page, 'page' the current page, and
 * 'document' every page in turn (one request per page, grouped by a shared batch id).
 * Revised items are buffered and only replace the page once the server has saved the
 * merged result, so a failed or partial reply never wipes the existing evaluation.
 */
export function useReevaluation() {
  const dispatch = useDispatch();
  const store = useStore();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;

  const revisePage = useCallback(async ({ pageIndex, prompt, scope, answerId, batchId, question }) => {
    const { activeSession, messageIds, annotations } = store.getState().evaluation;
    const pageKey = pageKeyOf(activeSession.id, pageIndex);
    const messageId = messageIds[pageKey];
    const turnId = uuidv4();
    dispatch(addTurn({
      id: turnId, role: 'model', batchId, scope, answerId, question, pageIndex, messageId,
      text: '', status: 'streaming', progress: 0, createdAt: new Date().toISOString(),
    }));
    const fail = (error) => dispatch(updateTurn({ id: turnId, changes: { status: 'error', error } }));
    if (!messageId) {
      fail('This page has not been evaluated yet.');
      return;
    }

    try {
      const path = endpoints.messages.reevaluate(messageId);
      const response = await fetchWithAuth(`${apiClient.defaults.baseURL}${tenant ? `/${tenant}` : ''}${path}`, {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          scope,
          answer_id: scope === 'answer' ? answerId : undefined,
          current_annotations: annotations[pageKey] || [],
          batch_id: batchId,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        fail(body.error || `Request failed (${response.status})`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let progress = 0;
      let finished = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const tag = line.slice(0, 3);
          let data;
          try { data = JSON.parse(line.slice(3)); } catch (_) { continue; }
          if (tag === 'ar:') {
            dispatch(updateTurn({ id: turnId, changes: { text: data.text } }));
          } else if (tag === 'aa:') {
            progress += 1;
            dispatch(updateTurn({ id: turnId, changes: { progress } }));
          } else if (tag === 'af:') {
            dispatch(replacePageAnnotations({ pageKey, items: data.annotations }));
            const r = data.revision;
            dispatch(updateTurn({ id: turnId, changes: {
              status: 'done', revisionId: r.id, scoreBefore: r.score_before, scoreAfter: r.score_after,
              text: r.reply, createdAt: r.created_at,
            } }));
            finished = true;
          } else if (tag === 'ad:' && data.finishReason === 'error') {
            fail(data.error || 'Re-evaluation failed.');
            finished = true;
          }
        }
      }
      if (!finished) fail('The connection closed before the model finished.');
    } catch (err) {
      fail(err.message || 'Re-evaluation failed.');
    }
  }, [dispatch, store, tenant]);

  const send = useCallback(async ({ prompt, scope, answerId }) => {
    const { pages, currentPageIndex, annotations, activeSession } = store.getState().evaluation;
    const text = prompt.trim();
    if (!text || !activeSession) return;
    const batchId = uuidv4();
    const question = scope === 'answer'
      ? (annotations[pageKeyOf(activeSession.id, currentPageIndex)] || []).find(a => a.id === answerId)?.question
      : null;
    const pageIndices = scope === 'document' ? pages.map((_, i) => i) : [currentPageIndex];

    dispatch(addTurn({
      id: `t-${batchId}`, role: 'teacher', batchId, scope, answerId, question,
      pageIndex: currentPageIndex, text, createdAt: new Date().toISOString(),
    }));
    dispatch(setChatBusy(true));
    try {
      for (const pageIndex of pageIndices) {
        await revisePage({ pageIndex, prompt: text, scope, answerId, batchId, question });
      }
    } finally {
      dispatch(setChatBusy(false));
    }
  }, [dispatch, store, revisePage]);

  return { send };
}
