import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createSession,
  setPages,
  setCurrentPageIndex,
  setAnnotationMessageId,
  streamAnnotation,
  setProcessingStatus,
  setProcessingError,
  updateSessionTitle,
} from '../store/chatSlice';

export function useOcrJob() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;

  const { selectedMode, selectedModels } = useSelector(s => s.ocrChat);

  const getTenantUrl = useCallback((path) => {
    if (tenant) return `${apiClient.defaults.baseURL}/${tenant}${path}`;
    return `${apiClient.defaults.baseURL}${path}`;
  }, [tenant]);

  /** Stream OCR for a single page, dispatching annotations to `${sessionId}_${pageIndex}`. */
  const streamPage = useCallback(async ({
    sessionId, pageIndex, page, sessionMode, generateText,
  }) => {
    const pageKey = `${sessionId}_${pageIndex}`;
    const isCompare = sessionMode === 'compare' || sessionMode === 'random';

    const userMessageId = uuidv4();
    const aiMessageIdA = uuidv4();
    const aiMessageIdB = uuidv4();

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
    const aiMessageB = {
      id: aiMessageIdB,
      role: 'assistant',
      content: '',
      parent_message_ids: [userMessageId],
      status: 'pending',
      participant: 'b',
    };

    const messages = isCompare
      ? [userMessage, aiMessageA, aiMessageB]
      : [userMessage, aiMessageA];

    dispatch(setAnnotationMessageId({ sessionId: pageKey, participant: 'modelA', messageId: aiMessageIdA }));
    if (isCompare) {
      dispatch(setAnnotationMessageId({ sessionId: pageKey, participant: 'modelB', messageId: aiMessageIdB }));
    }

    const response = await fetchWithAuth(getTenantUrl(endpoints.messages.stream), {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        messages,
        mode: 'OCR',
        generate_text_within: generateText,
      }),
    });

    if (!response.ok) throw new Error(`OCR stream failed for page ${pageIndex + 1}: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const modelStatus = { a: false, b: !isCompare };

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
        } else if (line.startsWith('ab:')) {
          try { dispatch(streamAnnotation({ sessionId: pageKey, participant: 'modelB', annotation: JSON.parse(line.slice(3)) })); }
          catch (e) { console.error('Failed to parse ab:', e); }
        } else if (line.startsWith('ad:')) {
          try { const d = JSON.parse(line.slice(3)); if (d.finishReason === 'error') console.error('Model A error (page', pageIndex + 1, '):', d.error); }
          catch (_) {}
          modelStatus.a = true;
        } else if (line.startsWith('bd:')) {
          try { const d = JSON.parse(line.slice(3)); if (d.finishReason === 'error') console.error('Model B error (page', pageIndex + 1, '):', d.error); }
          catch (_) {}
          modelStatus.b = true;
        }
      }
      if (modelStatus.a && modelStatus.b) break;
    }
  }, [dispatch, getTenantUrl]);

  const submitImage = useCallback(async (file, { generateBoxes = true, generateText = true } = {}) => {
    try {
      // Step 1: Upload — get pages array
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

      // Step 2: Create session
      dispatch(setProcessingStatus('processing'));
      const sessionResult = await dispatch(createSession({
        mode: selectedMode,
        modelA: selectedModels.modelA,
        modelB: selectedModels.modelB,
        type: 'OCR',
        metadata: { source_filename: file.name },
      }));

      if (createSession.rejected.match(sessionResult)) throw new Error('Failed to create session');

      const session = sessionResult.payload;
      const sessionId = session.id;

      if (!generateBoxes) {
        dispatch(setProcessingStatus('done'));
        navigate(tenant ? `/${tenant}/ocr/${sessionId}` : `/ocr/${sessionId}`);
        return;
      }

      // Step 3: Navigate immediately, then stream pages sequentially.
      // Sequential is required so DB created_at timestamps are reliably ordered —
      // parallel streams would create all user messages at nearly the same timestamp,
      // making page ordering non-deterministic on history reload.
      dispatch(setProcessingStatus('streaming'));
      navigate(tenant ? `/${tenant}/ocr/${sessionId}` : `/ocr/${sessionId}`);

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        await streamPage({ sessionId, pageIndex, page: pages[pageIndex], sessionMode: selectedMode, generateText });

        // Generate title right after page 0 finishes — first page is most representative
        if (pageIndex === 0) {
          try {
            const titleRes = await apiClient.post(`/sessions/${sessionId}/generate_title/`);
            if (titleRes.data?.title) dispatch(updateSessionTitle({ sessionId, title: titleRes.data.title }));
          } catch (_) { /* non-critical */ }
        }
      }

      dispatch(setProcessingStatus('done'));

    } catch (err) {
      console.error('OCR job failed:', err);
      dispatch(setProcessingError(err.message || 'Failed to process document.'));
    }
  }, [dispatch, navigate, tenant, selectedMode, selectedModels, streamPage]);

  return { submitImage };
}
