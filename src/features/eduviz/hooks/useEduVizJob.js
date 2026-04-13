import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createEduvizSession,
  setPages,
  setCurrentPageIndex,
  setAnnotationMessageId,
  streamAnnotation,
  setProcessingStatus,
  setProcessingError,
  updateSessionTitle,
} from '../store/eduvizSlice';

export function useEduVizJob() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;

  const { selectedModels } = useSelector(s => s.eduviz);

  const getTenantUrl = useCallback((path) => {
    if (tenant) return `${apiClient.defaults.baseURL}/${tenant}${path}`;
    return `${apiClient.defaults.baseURL}${path}`;
  }, [tenant]);

  /** Stream OCR for a single page */
  const streamPage = useCallback(async ({
    sessionId, pageIndex, page, generateText,
  }) => {
    const pageKey = `${sessionId}_${pageIndex}`;

    const userMessageId = uuidv4();
    const aiMessageIdA = uuidv4();

    const userMessage = {
      id: userMessageId,
      role: 'user',
      image_path: page.path,
      content: '',
      status: 'pending',
    };
    const aiMessageA = {
      id: aiMessageIdA,
      role: 'assistant',
      content: '',
      parent_message_ids: [userMessageId],
      status: 'pending',
      participant: 'a',
    };

    const messages = [userMessage, aiMessageA];

    dispatch(setAnnotationMessageId({ sessionId: pageKey, participant: 'modelA', messageId: aiMessageIdA }));

    const response = await fetchWithAuth(getTenantUrl(endpoints.messages.stream), {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        messages,
        mode: 'EDUVIZ',
        generate_text_within: generateText,
      }),
    });

    if (!response.ok) throw new Error(`OCR stream failed for page ${pageIndex + 1}: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('aa:')) {
          try { dispatch(streamAnnotation({ sessionId: pageKey, participant: 'modelA', annotation: JSON.parse(line.slice(3)) })); }
          catch (e) { console.error('Failed to parse aa:', e); }
        } else if (line.startsWith('ad:')) {
          try { const d = JSON.parse(line.slice(3)); if (d.finishReason === 'error') console.error('Model error:', d.error); }
          catch (_) {}
          break;
        }
      }
    }
  }, [dispatch, getTenantUrl]);

  const submitImage = useCallback(async (file, { generateBoxes = true, generateText = true } = {}) => {
    try {
      dispatch(setProcessingStatus('uploading'));

      const formData = new FormData();
      formData.append('file', file);
      const uploadUrl = tenant
        ? `/${tenant}${endpoints.messages.upload_ocr_image}`
        : endpoints.messages.upload_ocr_image;

      const uploadRes = await apiClient.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { pages } = uploadRes.data;
      dispatch(setPages(pages));
      dispatch(setCurrentPageIndex(0));

      dispatch(setProcessingStatus('processing'));
      const sessionResult = await dispatch(createEduvizSession({
        mode: 'direct',
        modelA: selectedModels.modelA,
        type: 'EDUVIZ',
        metadata: {
          source_filename: file.name,
          page_dimensions: pages.map(p => ({ width: p.width || null, height: p.height || null })),
        },
      }));

      if (createEduvizSession.rejected.match(sessionResult)) throw new Error('Failed to create session');

      const session = sessionResult.payload;
      const sessionId = session.id;

      if (!generateBoxes) {
        dispatch(setProcessingStatus('done'));
        navigate(tenant ? `/${tenant}/eduviz/${sessionId}` : `/eduviz/${sessionId}`);
        return;
      }

      dispatch(setProcessingStatus('streaming'));
      navigate(tenant ? `/${tenant}/eduviz/${sessionId}` : `/eduviz/${sessionId}`);

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        await streamPage({ sessionId, pageIndex, page: pages[pageIndex], generateText });

        if (pageIndex === 0) {
          try {
            const titleRes = await apiClient.post(`/sessions/${sessionId}/generate_title/`);
            if (titleRes.data?.title) dispatch(updateSessionTitle({ sessionId, title: titleRes.data.title }));
          } catch (_) { /* non-critical */ }
        }
      }

      dispatch(setProcessingStatus('done'));

    } catch (err) {
      console.error('EduViz job failed:', err);
      dispatch(setProcessingError(err.message || 'Failed to process document.'));
    }
  }, [dispatch, navigate, tenant, selectedModels, streamPage]);

  return { submitImage };
}
