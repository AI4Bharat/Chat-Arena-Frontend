import { useDispatch, useSelector } from 'react-redux';
import { StarRating } from './StarRating';
import { updateAnnotationAssessment } from '../store/eduvizSlice';

export function EduVizAssessmentPanel() {
  const dispatch = useDispatch();
  const {
    activeSession,
    currentPageIndex,
    annotations,
    selectedAnnotationId,
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

  const handleUpdate = (updates) => {
    if (!selectedAnnotationId) return;
    dispatch(updateAnnotationAssessment({
      sessionId: pageKey, // wait! The reducer takes sessionId from payload but uses it as the dictionary key, which we have named pageKey here
      participant,
      annotationId: selectedAnnotationId,
      assessmentUpdate: updates
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {currentAnnotation ? `Assessing: ${(currentAnnotation.type || 'Block').charAt(0).toUpperCase() + (currentAnnotation.type || 'Block').slice(1)}` : 'Assessment Panel'}
        </h2>
      </div>

      {!selectedAnnotationId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No Block Selected</p>
          <p className="text-xs text-gray-400">Click on any text, diagram, or drawn error box on the document to evaluate it.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full pb-8">
          {/* Why Incorrect */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Why Incorrect / Notes?
            </label>
            <textarea
              value={assessment.whyIncorrect}
              onChange={(e) => handleUpdate({ whyIncorrect: e.target.value })}
              placeholder="Provide notes or describe any errors found..."
              rows={3}
              className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 placeholder:text-gray-400"
            />
          </div>

          {/* Suggested Improvement */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Suggested Improvement
            </label>
            <textarea
              value={assessment.suggestedImprovement}
              onChange={(e) => handleUpdate({ suggestedImprovement: e.target.value })}
              placeholder="How could the student improve this block?"
              rows={3}
              className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 placeholder:text-gray-400"
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
    </div>
  );
}
