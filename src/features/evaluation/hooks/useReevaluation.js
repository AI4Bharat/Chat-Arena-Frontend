import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import { addTurn, pageNumberOf, replaceItems, setChatBusy, updateTurn } from '../store/evaluationSlice';

/**
 * Sends the teacher's feedback to the model and swaps in its revised evaluation.
 *
 * scope 'answer' revises one question (all of its boxes, on every page), 'page' the
 * questions with a box on the current page, and 'document' the whole sheet — always one
 * request. Revised items are buffered and only replace the sheet once the server has saved
 * the merged result, so a failed or partial reply never wipes the existing evaluation.
 */
export function useReevaluation() {
  const dispatch = useDispatch();
  const store = useStore();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;

  const send = useCallback(async ({ prompt, scope, answerId }) => {
    const { items, messageId, currentPageIndex } = store.getState().evaluation;
    const text = prompt.trim();
    if (!text) return;
    const page = pageNumberOf(currentPageIndex);
    const question = scope === 'answer' ? items.find(a => a.id === answerId)?.question : null;
    const base = { scope, answerId: scope === 'answer' ? answerId : null, question, page: scope === 'page' ? page : null };
    const turnId = uuidv4();
    const now = new Date().toISOString();
    dispatch(addTurn({ ...base, id: `t-${turnId}`, role: 'teacher', text, createdAt: now }));
    dispatch(addTurn({ ...base, id: turnId, role: 'model', messageId, text: '', status: 'streaming', progress: 0, createdAt: now }));
    const fail = (error) => dispatch(updateTurn({ id: turnId, changes: { status: 'error', error } }));
    if (!messageId) {
      fail('This sheet has not been evaluated yet.');
      return;
    }

    dispatch(setChatBusy(true));
    try {
      const path = endpoints.messages.reevaluate(messageId);
      const response = await fetchWithAuth(`${apiClient.defaults.baseURL}${tenant ? `/${tenant}` : ''}${path}`, {
        method: 'POST',
        body: JSON.stringify({
          prompt: text,
          scope,
          answer_id: scope === 'answer' ? answerId : undefined,
          page: scope === 'page' ? page : undefined,
          current_annotations: items,
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
          if (tag === 'as:') {
            dispatch(updateTurn({ id: turnId, changes: { note: data.text } }));
          } else if (tag === 'ar:') {
            dispatch(updateTurn({ id: turnId, changes: { text: data.text } }));
          } else if (tag === 'aa:') {
            progress += 1;
            dispatch(updateTurn({ id: turnId, changes: { progress } }));
          } else if (tag === 'af:') {
            dispatch(replaceItems(data.annotations));
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
    } finally {
      dispatch(setChatBusy(false));
    }
  }, [dispatch, store, tenant]);

  return { send };
}
