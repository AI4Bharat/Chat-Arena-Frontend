import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { setActiveCompareTab } from '../store/chatSlice';
import { OcrCanvas } from './OcrCanvas';
import { OcrAnnotationPanel } from './OcrAnnotationPanel';
import { OcrToolbar } from './OcrToolbar';
import { OcrFeedbackSelector } from './OcrFeedbackSelector';

/**
 * OcrCompareView — side-by-side comparison of two OCR models.
 *
 * Layout:
 *   - Single shared image on the left with BOTH models' boxes overlaid
 *     (Model A = solid stroke, Model B = dashed stroke)
 *   - Tabbed annotation panel on the right (Model A | Model B)
 *   - Feedback selector bar at the bottom
 */
export function OcrCompareView({ sessionId }) {
  const dispatch = useDispatch();
  const { pages, currentPageIndex, annotations, activeSession, activeCompareTab } = useSelector(s => s.ocrChat);
  const currentPage = pages[currentPageIndex];

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [winner, setWinner] = useState(null);

  const pageKey = `${sessionId}_${currentPageIndex}`;
  const sessionAnnotations = annotations[pageKey] || annotations[sessionId] || { modelA: [], modelB: [] };
  const annA = sessionAnnotations.modelA || [];
  const annB = sessionAnnotations.modelB || [];

  const activeAnnotations = activeCompareTab === 'modelA' ? annA : annB;

  const handleTabChange = (tab) => {
    dispatch(setActiveCompareTab(tab));
  };

  const handleFeedback = async (preference) => {
    try {
      await apiClient.post(endpoints.feedback.submit, {
        session_id: sessionId,
        feedback_type: 'preference',
        preference,
      });
      setWinner(preference);
      setFeedbackSubmitted(true);
      toast.success('Preference recorded!');
    } catch (err) {
      toast.error('Failed to submit preference.');
    }
  };

  if (!currentPage) return null;

  const modelAName = activeSession?.model_a?.display_name || 'Model A';
  const modelBName = activeSession?.model_b?.display_name || 'Model B';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <OcrToolbar />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: shared canvas with both models' boxes */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#1e1e1e] relative" style={{ minWidth: 0 }}>
          <OcrCanvas
            imageUrl={currentPage.url}
            imageWidth={currentPage.width}
            imageHeight={currentPage.height}
            annotations={annA}
            annotationsB={annB}
            sessionId={pageKey}
            participant={activeCompareTab === 'modelA' ? 'modelA' : 'modelB'}
            compareMode
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200 dark:bg-[#3a3a3a] flex-shrink-0" />

        {/* Right: tabbed annotation panel */}
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-[#2a2a2a]" style={{ minWidth: 0 }}>
          {/* Model tabs */}
          <div className="flex border-b border-gray-200 dark:border-[#3a3a3a] flex-shrink-0">
            <button
              onClick={() => handleTabChange('modelA')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeCompareTab === 'modelA'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
                  : 'text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#ececec] hover:bg-gray-50 dark:hover:bg-[#333333]'
              }`}
            >
              {modelAName}
              <span className="ml-1.5 text-gray-400 tabular-nums">({annA.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('modelB')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeCompareTab === 'modelB'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
                  : 'text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#ececec] hover:bg-gray-50 dark:hover:bg-[#333333]'
              }`}
            >
              {modelBName}
              <span className="ml-1.5 text-gray-400 dark:text-[#a0a0a0] tabular-nums">({annB.length})</span>
            </button>
          </div>

          {/* Annotation cards for active tab */}
          <div className="flex-1 overflow-hidden">
            <OcrAnnotationPanel
              annotations={activeAnnotations}
              sessionId={sessionId}
              participant={activeCompareTab}
            />
          </div>
        </div>
      </div>

      {/* Feedback bar */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] px-4">
        <OcrFeedbackSelector
          onSelect={handleFeedback}
          submitted={feedbackSubmitted}
          winner={winner}
        />
      </div>
    </div>
  );
}
