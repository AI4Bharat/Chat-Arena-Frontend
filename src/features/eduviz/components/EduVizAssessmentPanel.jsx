import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { StarRating } from './StarRating';
import { updateAnnotationAssessment, submitAssessment, setSubmitStatus } from '../store/eduvizSlice';
import { getEduvizTypeColor, getEduvizTypeLabel } from '../utils/eduvizTypeColors';

export function EduVizAssessmentPanel() {
  const dispatch = useDispatch();
  const {
    metadata,
    submitStatus,
    activeSession,
    currentPageIndex,
    annotations,
    selectedAnnotationId,
    annotationMessageIds,
    editedAnnotations,
  } = useSelector(s => s.eduviz);

  const sessionId = activeSession?.id;
  const pageKey = sessionId ? `${sessionId}_${currentPageIndex}` : null;
  const participant = 'modelA';

  // Read assessment from the currently selected annotation (if any)
  const currentAnnotation = selectedAnnotationId && pageKey
    ? editedAnnotations[pageKey]?.[participant]?.[selectedAnnotationId]
    : null;

  const assessment = currentAnnotation?.assessment || {
    whyIncorrect: '',
    suggestedImprovement: '',
    rubrics: { legibility: 0, spellingAccuracy: 0, contentCorrectness: 0 },
  };

  const messageId = pageKey ? annotationMessageIds?.[pageKey]?.[participant] : null;
  const annotatedBlocks = pageKey ? Object.values(editedAnnotations[pageKey]?.[participant] || {}) : [];

  // Reset submit status after 3 seconds
  useEffect(() => {
    if (submitStatus === 'saved' || submitStatus === 'error') {
      const timer = setTimeout(() => dispatch(setSubmitStatus('idle')), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus, dispatch]);

  const handleSubmit = () => {
    if (!messageId) return;
    dispatch(submitAssessment({
      messageId,
      assessment: {
        metadata,
        annotatedBlocks,
      },
    }));
  };

  const handleUpdate = (updates) => {
    if (!selectedAnnotationId) return;
    dispatch(updateAnnotationAssessment({
      sessionId: pageKey, // wait! The reducer takes sessionId from payload but uses it as the dictionary key, which we have named pageKey here
      participant,
      annotationId: selectedAnnotationId,
      assessmentUpdate: updates
    }));
  };

  // Extract display label and color matching the canvas pill
  const labels = currentAnnotation?.labels || (currentAnnotation?.type ? [currentAnnotation.type] : []);
  
  const getLabelText = (type) => {
    return type.includes('_error') ? getEduvizTypeLabel(type) : (type.charAt(0).toUpperCase() + type.slice(1) || 'Block');
  };

  const displayTitle = labels.length > 0 
    ? labels.map(getLabelText).join(', ')
    : 'Block';

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="flex gap-1.5 mr-1">
            {labels.map((label, idx) => (
              <div 
                key={idx} 
                className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shadow-sm" 
                style={{ backgroundColor: getEduvizTypeColor(label) }} 
              />
            ))}
            {labels.length === 0 && (
               <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shadow-sm bg-gray-200" />
            )}
          </div>
          <h2 className="text-[11px] sm:text-[13px] font-bold text-gray-800 uppercase tracking-widest break-words flex-1">
            {currentAnnotation ? `Assessing: ${displayTitle}` : 'Assessment Panel'}
          </h2>
        </div>
      </div>

      {!selectedAnnotationId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No Block Selected</p>
          <p className="text-xs text-gray-400">Click on any text, diagram, or drawn error box on the document to evaluate it.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full pb-8">
          {/* Why Incorrect */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Why Incorrect / Notes?
            </label>
            <textarea
              value={assessment.whyIncorrect}
              onChange={(e) => handleUpdate({ whyIncorrect: e.target.value })}
              placeholder="Provide notes or describe any errors found..."
              rows={3}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-sm placeholder:text-gray-400 transition-all duration-200"
            />
          </div>

          {/* Suggested Improvement */}
          <div>
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Suggested Improvement
            </label>
            <textarea
              value={assessment.suggestedImprovement}
              onChange={(e) => handleUpdate({ suggestedImprovement: e.target.value })}
              placeholder="How could the student improve this block?"
              rows={2}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-sm placeholder:text-gray-400 transition-all duration-200"
            />
          </div>

          {/* Scoring Rubrics */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Scoring Rubrics
            </label>
            <div className="space-y-3">
              <StarRating
                label="Legibility"
                score={assessment.rubrics.legibility}
                onChange={(score) => handleUpdate({ rubrics: { legibility: score } })}
              />
              <StarRating
                label="Spelling Accuracy"
                score={assessment.rubrics.spellingAccuracy}
                onChange={(score) => handleUpdate({ rubrics: { spellingAccuracy: score } })}
              />
              <StarRating
                label="Content Correctness"
                score={assessment.rubrics.contentCorrectness}
                onChange={(score) => handleUpdate({ rubrics: { contentCorrectness: score } })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button locked to bottom of assessment panel */}
      {selectedAnnotationId && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 mt-auto">
          <button
            onClick={handleSubmit}
            disabled={!messageId || submitStatus === 'saving'}
            className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-300 shadow-md ${submitStatus === 'saved'
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 text-white'
              : submitStatus === 'error'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 text-white'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20 hover:shadow-orange-500/40 text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            {submitStatus === 'saving' && <Loader2 size={16} className="animate-spin" />}
            {submitStatus === 'saved' && <CheckCircle2 size={16} />}
            {submitStatus === 'error' && <AlertCircle size={16} />}
            {submitStatus === 'saving' ? 'Saving…' :
              submitStatus === 'saved' ? 'Saved!' :
                submitStatus === 'error' ? 'Error' :
                  'Submit Annotation'}
          </button>
        </div>
      )}
    </div>
  );
}
