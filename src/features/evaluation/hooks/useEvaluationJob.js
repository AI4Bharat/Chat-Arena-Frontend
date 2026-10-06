import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createEvalSession,
  setCurrentPageIndex,
  setEvalStatus,
  setMessageId,
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

  /**
   * Evaluate the whole sheet in one model call, so an answer that continues onto the next
   * page is judged as one answer. Items stream in as the model produces them.
   */
  const run = useCallback(async (sessionId) => {
    dispatch(setEvalStatus({ status: 'streaming' }));
    let status = 'done';
    let error = null;
    try {
      const response = await fetchWithAuth(`${apiClient.defaults.baseURL}${withTenant(endpoints.messages.evaluateDocument)}`, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Evaluation request failed (${response.status})`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
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
          if (tag === 'am:') dispatch(setMessageId(data.message_id));
          else if (tag === 'aa:') dispatch(streamItem(data));
          else if (tag === 'ad:' && data.finishReason === 'error') {
            status = 'error';
            error = data.error || 'Evaluation failed.';
          }
        }
      }
    } catch (err) {
      status = 'error';
      error = err.message || 'Evaluation failed.';
    }
    dispatch(setEvalStatus({ status, error }));
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
          answer_pages: pages.map(p => ({ path: p.path, width: p.width || null, height: p.height || null })),
          reference_pages: referencePages.map(p => ({ path: p.path, width: p.width, height: p.height })),
          instructions: instructions?.trim() || '',
          max_marks: maxMarks,
        },
      }));
      if (createEvalSession.rejected.match(result)) throw new Error('Could not create the evaluation session.');
      const sessionId = result.payload.id;

      dispatch(setPages(pages));
      dispatch(setCurrentPageIndex(0));
      dispatch(setProcessingStatus('done'));
      navigate(tenant ? `/${tenant}/evaluate/${sessionId}` : `/evaluate/${sessionId}`);

      await run(sessionId);

      try {
        const titleRes = await apiClient.post(withTenant(`/sessions/${sessionId}/generate_title/`));
        if (titleRes.data?.title) dispatch(updateSessionTitle({ sessionId, title: titleRes.data.title }));
      } catch (_) { /* a title is cosmetic */ }
    } catch (err) {
      console.error('Evaluation failed:', err);
      dispatch(setProcessingError(err.message || 'Evaluation failed.'));
    }
  }, [dispatch, navigate, tenant, selectedModelId, upload, run, withTenant]);

  return { submit, run };
}
