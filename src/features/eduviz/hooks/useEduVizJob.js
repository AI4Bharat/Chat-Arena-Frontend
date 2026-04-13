import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { useTenant } from '../../../shared/context/TenantContext';
import {
  createEduvizSession,
  setPages,
  setCurrentPageIndex,
  setReferenceImageUrl,
  setStudentImageUrl,
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

  /**
   * Upload two images (reference material + student handwriting) and
   * create a session. No OCR model prediction — teacher will annotate manually.
   * Image URLs are persisted in the session metadata.
   */
  const submitImages = useCallback(async (referenceFile, studentFile, taskType) => {
    try {
      dispatch(setProcessingStatus('uploading'));

      const uploadUrl = tenant
        ? `/${tenant}${endpoints.messages.upload_ocr_image}`
        : endpoints.messages.upload_ocr_image;

      // Upload reference material
      const refFormData = new FormData();
      refFormData.append('file', referenceFile);
      const refRes = await apiClient.post(uploadUrl, refFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const refPages = refRes.data.pages;

      // Upload student handwriting
      const studentFormData = new FormData();
      studentFormData.append('file', studentFile);
      const studentRes = await apiClient.post(uploadUrl, studentFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const studentPages = studentRes.data.pages;

      // Store the first page of each as the primary images
      const referencePageUrl = refPages[0]?.url || null;
      const studentPageUrl = studentPages[0]?.url || null;
      const refImagePath = refPages[0]?.path || refRes.data.image_path || null;
      const studentImagePath = studentPages[0]?.path || studentRes.data.image_path || null;

      dispatch(setReferenceImageUrl(referencePageUrl));
      dispatch(setStudentImageUrl(studentPageUrl));

      // Use student pages as the main "pages" for annotation
      dispatch(setPages(studentPages));
      dispatch(setCurrentPageIndex(0));

      dispatch(setProcessingStatus('processing'));

      // Create session with all image metadata so they persist
      const sessionResult = await dispatch(createEduvizSession({
        mode: 'direct',
        modelA: null,
        type: 'EDUVIZ',
        metadata: {
          taskType: taskType || 'Middle - Writing', // Default to Writing if not provided
          source_filename: studentFile.name,
          reference_filename: referenceFile.name,
          reference_image_url: referencePageUrl,
          reference_image_path: refImagePath,
          student_image_url: studentPageUrl,
          student_image_path: studentImagePath,
          page_dimensions: studentPages.map(p => ({
            width: p.width || null,
            height: p.height || null,
          })),
        },
      }));

      if (createEduvizSession.rejected.match(sessionResult)) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.payload;
      const sessionId = session.id;

      // Go straight to annotation view — no model inference needed
      dispatch(setProcessingStatus('done'));
      navigate(tenant ? `/${tenant}/eduviz/${sessionId}` : `/eduviz/${sessionId}`);

    } catch (err) {
      console.error('EduViz job failed:', err);
      dispatch(setProcessingError(err.message || 'Failed to process documents.'));
    }
  }, [dispatch, navigate, tenant]);

  return { submitImages };
}
