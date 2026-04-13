import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, CheckCircle2, AlertCircle, X, Trash2, Settings, MessageSquare, ListTodo, ChevronRight, PanelRight, LayoutList } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { StarRating } from './StarRating';
import {
  updateAnnotationAssessment, submitAssessment, setSubmitStatus,
  toggleSidebar, setSuggestedImprovement, syncEduvizSession,
  deleteAnnotation, toggleAnnotationLabel, setSessionRubricScore,
  setMetadataField
} from '../store/eduvizSlice';
import { getEduvizTypeColor, getEduvizTypeLabel } from '../utils/eduvizTypeColors';
import { getRubricsForTaskType, TASK_TYPES } from '../utils/rubricConfig';

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
    suggestedImprovement,
    sessionRubrics,
  } = useSelector(s => s.eduviz);

  const sessionId = activeSession?.id;
  const pageKey = sessionId ? `${sessionId}_${currentPageIndex}` : null;
  const participant = 'modelA';

  // Dynamic rubrics based on task type
  const currentTaskType = metadata?.taskType || 'Middle - Writing';
  const rubricConfig = getRubricsForTaskType(currentTaskType);

  // Read assessment from the currently selected annotation (if any)
  const currentAnnotation = selectedAnnotationId && pageKey
    ? editedAnnotations[pageKey]?.[participant]?.[selectedAnnotationId]
    : null;

  const assessment = currentAnnotation?.assessment || {
    whyIncorrect: '',
    rubrics: {},
  };

  const messageId = pageKey ? annotationMessageIds?.[pageKey]?.[participant] : null;

  // Function to handle global task type change
  const handleTaskTypeChange = (newType) => {
    dispatch(setMetadataField({ field: 'taskType', value: newType }));
  };

  const annotatedBlocks = pageKey ? Object.values(editedAnnotations[pageKey]?.[participant] || {}) : [];

  // Reset submit status after 3 seconds
  useEffect(() => {
    if (submitStatus === 'saved' || submitStatus === 'error') {
      const timer = setTimeout(() => dispatch(setSubmitStatus('idle')), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus, dispatch]);

  const handleSubmit = async () => {
    if (messageId) {
      dispatch(submitAssessment({
        messageId,
        assessment: {
          metadata,
          suggestedImprovement,
          annotatedBlocks,
        },
      }));
    } else if (sessionId) {
      // Use the unified atomic sync for manual sessions
      dispatch(syncEduvizSession({ sessionId }));
    }
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {labels.length > 0 ? (
                labels.map((label, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-gray-200 shadow-sm"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getEduvizTypeColor(label) }}
                    />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{getLabelText(label)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleAnnotationLabel({ sessionId: pageKey, participant, annotationId: selectedAnnotationId, label }));
                      }}
                      className="p-0.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove label"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))
              ) : (
                currentAnnotation && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Unlabeled</span>
                  </div>
                )
              )}
            </div>
            <h2 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] truncate">
              {currentAnnotation ? 'Assessing Block' : 'Assessment Panel'}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch(toggleSidebar(false))}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Close panel"
            >
              <PanelRight size={18} />
            </button>
          </div>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full pb-8">
        <div className="px-4 py-4 space-y-6">
          {/* 1. Block-Level Assessment (Gated by Selection) */}
          {selectedAnnotationId && (
            <section className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <ListTodo size={14} className="text-blue-500" />
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Block Specifics</h3>
              </div>

              <div className="space-y-4">
                {/* Per-block: Why Incorrect */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Why Incorrect / Notes?
                  </label>
                  <textarea
                    value={assessment.whyIncorrect}
                    onChange={(e) => handleUpdate({ whyIncorrect: e.target.value })}
                    placeholder="Describe errors found in this specific block…"
                    rows={3}
                    className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm placeholder:text-gray-400 transition-all duration-200"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 2. Task-Level Assessment (Always Visible) */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <Settings size={14} className="text-orange-500" />
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Task Global Scoring</h3>
            </div>

            {/* Task Type Switcher */}
            <div className="flex items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-2">
                <LayoutList size={14} className="text-orange-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Task</span>
              </div>
              <select
                value={currentTaskType}
                onChange={(e) => handleTaskTypeChange(e.target.value)}
                className="px-2 py-1 text-[11px] font-semibold bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm"
              >
                {TASK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Scoring Rubrics */}
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                Scoring Rubrics
                {metadata.taskType && (
                  <span className="ml-2 font-normal text-orange-500/70 normal-case">
                    ({metadata.taskType})
                  </span>
                )}
              </label>
              <div className="space-y-3">
                {rubricConfig.map(rubric => (
                  <StarRating
                    key={rubric.key}
                    label={rubric.label}
                    score={sessionRubrics?.[rubric.key] || 0}
                    onChange={(score) => dispatch(setSessionRubricScore({ key: rubric.key, score }))}
                  />
                ))}
              </div>
            </div>

            {/* Common Suggested Improvement */}
            <div className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3">
              <label className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">
                <MessageSquare size={12} />
                Suggested Improvement
              </label>
              <textarea
                value={suggestedImprovement}
                onChange={(e) => dispatch(setSuggestedImprovement(e.target.value))}
                placeholder="Overall feedback for the student's task…"
                rows={3}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-amber-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm placeholder:text-gray-400 transition-all duration-200"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Submit Button locked to bottom of assessment panel */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 mt-auto">
        <button
          onClick={handleSubmit}
          disabled={(!messageId && !sessionId) || submitStatus === 'saving'}
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
    </div>
  );
}
