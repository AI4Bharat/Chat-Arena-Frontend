import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createSession,
  setCurrentImage,
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

  const submitImage = useCallback(async (file, { generateBoxes = true, generateText = true } = {}) => {
    try {
      // Step 1: Upload image to GCS
      dispatch(setProcessingStatus('uploading'));

      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = tenant
        ? `/${tenant}${endpoints.messages.upload_ocr_image}`
        : endpoints.messages.upload_ocr_image;

      const uploadRes = await apiClient.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { path, url, width, height } = uploadRes.data;
      dispatch(setCurrentImage({ path, url, width, height }));

      // Step 2: Create session
      dispatch(setProcessingStatus('processing'));

      const sessionResult = await dispatch(createSession({
        mode: selectedMode,
        modelA: selectedModels.modelA,
        modelB: selectedModels.modelB,
        type: 'OCR',
      }));

      if (createSession.rejected.match(sessionResult)) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.payload;
      const sessionId = session.id;

      // If no box generation requested, skip OCR stream and go straight to session
      if (!generateBoxes) {
        dispatch(setProcessingStatus('done'));
        navigate(tenant ? `/${tenant}/ocr/${sessionId}` : `/ocr/${sessionId}`);
        return;
      }

      // Step 3: Build messages for stream endpoint
      const userMessageId = uuidv4();
      const aiMessageIdA = uuidv4();
      const aiMessageIdB = uuidv4();

      const userMessage = {
        id: userMessageId,
        role: 'user',
        image_path: path,
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

      const isCompare = selectedMode === 'compare' || selectedMode === 'random';
      const messages = isCompare
        ? [userMessage, aiMessageA, aiMessageB]
        : [userMessage, aiMessageA];

      // Step 4: Register message IDs and navigate to session immediately
      dispatch(setAnnotationMessageId({ sessionId, participant: 'modelA', messageId: aiMessageIdA }));
      if (isCompare) {
        dispatch(setAnnotationMessageId({ sessionId, participant: 'modelB', messageId: aiMessageIdB }));
      }
      dispatch(setProcessingStatus('streaming'));
      navigate(tenant ? `/${tenant}/ocr/${sessionId}` : `/ocr/${sessionId}`);

      // Step 5: Call stream endpoint, dispatch individual annotations as they arrive
      const response = await fetchWithAuth(getTenantUrl(endpoints.messages.stream), {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          messages,
          mode: 'OCR',
          generate_text_within: generateText,
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR stream failed: ${response.status}`);
      }

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
            try {
              const annotation = JSON.parse(line.slice(3));
              dispatch(streamAnnotation({ sessionId, participant: 'modelA', annotation }));
            } catch (e) {
              console.error('Failed to parse aa: event', e);
            }
          } else if (line.startsWith('ab:')) {
            try {
              const annotation = JSON.parse(line.slice(3));
              dispatch(streamAnnotation({ sessionId, participant: 'modelB', annotation }));
            } catch (e) {
              console.error('Failed to parse ab: event', e);
            }
          } else if (line.startsWith('ad:')) {
            try {
              const data = JSON.parse(line.slice(3));
              if (data.finishReason === 'error') console.error('Model A OCR error:', data.error);
            } catch (e) { /* ignore */ }
            modelStatus.a = true;
          } else if (line.startsWith('bd:')) {
            try {
              const data = JSON.parse(line.slice(3));
              if (data.finishReason === 'error') console.error('Model B OCR error:', data.error);
            } catch (e) { /* ignore */ }
            modelStatus.b = true;
          }
        }

        if (modelStatus.a && modelStatus.b) break;
      }

      dispatch(setProcessingStatus('done'));

      // Generate title from annotations
      try {
        const titleRes = await apiClient.post(`/sessions/${sessionId}/generate_title/`);
        if (titleRes.data?.title) {
          dispatch(updateSessionTitle({ sessionId, title: titleRes.data.title }));
        }
      } catch (_) { /* non-critical */ }

    } catch (err) {
      console.error('OCR job failed:', err);
      dispatch(setProcessingError(err.message || 'Failed to process document.'));
    }
  }, [dispatch, navigate, tenant, selectedMode, selectedModels, getTenantUrl]);

  return { submitImage };
}
