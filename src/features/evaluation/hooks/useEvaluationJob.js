import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createEvalSession,
  pageKeyOf,
  setCurrentPageIndex,
  setMessageId,
  setPageStatus,
  setPages,
  setProcessingError,
  setProcessingStatus,
  streamItem,
  updateSessionTitle,
} from '../store/evaluationSlice';

export function useEvaluationJob() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;
  const selectedModelId = useSelector(s => s.evaluation.selectedModelId);

  const withTenant = useCallback((path) => (tenant ? `/${tenant}${path}` : path), [tenant]);

  const upload = useCallback(async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post(withTenant(endpoints.messages.upload_ocr_image), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.pages;
  }, [withTenant]);

  /** Evaluate one answer-sheet page; annotations stream into `${sessionId}_${pageIndex}`. */
  const evaluatePage = useCallback(async (sessionId, pageIndex, page) => {
    const pageKey = pageKeyOf(sessionId, pageIndex);
    const userMessageId = uuidv4();
    const assistantMessageId = uuidv4();
    dispatch(setMessageId({ pageKey, messageId: assistantMessageId }));
    dispatch(setPageStatus({ pageKey, status: 'streaming' }));

    const response = await fetchWithAuth(`${apiClient.defaults.baseURL}${withTenant(endpoints.messages.stream)}`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        mode: 'EVAL',
        messages: [
          { id: userMessageId, role: 'user', image_path: page.path, content: '', status: 'pending' },
          { id: assistantMessageId, role: 'assistant', content: '', parent_message_ids: [userMessageId],
            status: 'pending', participant: 'a' },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Evaluation request failed for page ${pageIndex + 1} (${response.status})`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let status = 'done';
    let error = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('aa:')) {
          try {
            dispatch(streamItem({ pageKey, item: JSON.parse(line.slice(3)) }));
          } catch (e) {
            console.error('Unparseable evaluation item', e);
          }
        } else if (line.startsWith('ad:')) {
          try {
            const finish = JSON.parse(line.slice(3));
            if (finish.finishReason === 'error') {
              status = 'error';
              error = finish.error || 'Evaluation failed.';
            }
          } catch (_) { /* ignore malformed terminator */ }
        }
      }
    }
    dispatch(setPageStatus({ pageKey, status, error }));
  }, [dispatch, withTenant]);

  const submit = useCallback(async ({ answerFile, referenceFile, maxMarks, instructions }) => {
    try {
      dispatch(setProcessingStatus('uploading'));
      const pages = await upload(answerFile);
      const referencePages = referenceFile ? await upload(referenceFile) : [];

      dispatch(setProcessingStatus('processing'));
      const result = await dispatch(createEvalSession({
        modelId: selectedModelId,
        metadata: {
          source_filename: answerFile.name,
          reference_filename: referenceFile?.name || null,
          reference_pages: referencePages.map(p => ({ path: p.path, width: p.width, height: p.height })),
          instructions: instructions?.trim() || '',
          max_marks: maxMarks,
          page_dimensions: pages.map(p => ({ width: p.width || null, height: p.height || null })),
        },
      }));
      if (createEvalSession.rejected.match(result)) throw new Error('Could not create the evaluation session.');
      const sessionId = result.payload.id;

      dispatch(setPages(pages));
      dispatch(setCurrentPageIndex(0));
      dispatch(setProcessingStatus('streaming'));
      navigate(tenant ? `/${tenant}/evaluate/${sessionId}` : `/evaluate/${sessionId}`);

      // Pages run one after another so message timestamps keep page order on reload.
      for (let i = 0; i < pages.length; i++) {
        await evaluatePage(sessionId, i, pages[i]);
      }

      try {
        const titleRes = await apiClient.post(withTenant(`/sessions/${sessionId}/generate_title/`));
        if (titleRes.data?.title) dispatch(updateSessionTitle({ sessionId, title: titleRes.data.title }));
      } catch (_) { /* a title is cosmetic */ }

      dispatch(setProcessingStatus('done'));
    } catch (err) {
      console.error('Evaluation failed:', err);
      dispatch(setProcessingError(err.message || 'Evaluation failed.'));
    }
  }, [dispatch, navigate, tenant, selectedModelId, upload, evaluatePage, withTenant]);

  return { submit };
}
