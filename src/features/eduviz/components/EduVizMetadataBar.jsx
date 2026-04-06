import { useDispatch, useSelector } from 'react-redux';
import { setMetadataField, submitAssessment, setSubmitStatus } from '../store/eduvizSlice';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const GRADE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` }));

const SUBJECT_OPTIONS = [
  { value: 'maths', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'other', label: 'Other' },
];

const TASK_TYPE_OPTIONS = [
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'essay', label: 'Essay' },
  { value: 'fill_blanks', label: 'Fill in the Blanks' },
  { value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'odia', label: 'Odia' },
  { value: 'other', label: 'Other' },
];

const SCRIPT_OPTIONS = [
  { value: 'latin', label: 'Latin' },
  { value: 'devanagari', label: 'Devanagari' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'odia', label: 'Odia' },
  { value: 'other', label: 'Other' },
];

const WRITING_OPTIONS = [
  { value: 'pen', label: 'Pen' },
  { value: 'pencil', label: 'Pencil' },
];

function MetaSelect({ label, field, options, value }) {
  const dispatch = useDispatch();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={(e) => dispatch(setMetadataField({ field, value: e.target.value }))}
        className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 min-w-[90px] cursor-pointer"
      >
        <option value="">Select</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function EduVizMetadataBar() {
  const dispatch = useDispatch();
  const {
    metadata,
    submitStatus,
    activeSession,
    currentPageIndex,
    annotationMessageIds,
    editedAnnotations,
  } = useSelector(s => s.eduviz);

  const sessionId = activeSession?.id;
  const pageKey = sessionId ? `${sessionId}_${currentPageIndex}` : null;
  const messageId = pageKey ? annotationMessageIds?.[pageKey]?.modelA : null;

  // Submit all annotated blocks combined
  const annotatedBlocks = pageKey ? Object.values(editedAnnotations[pageKey]?.modelA || {}) : [];

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

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 overflow-x-auto flex-shrink-0">
      <div className="flex items-center gap-4">
        <MetaSelect label="Grade" field="grade" options={GRADE_OPTIONS} value={metadata.grade} />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <MetaSelect label="Subject" field="subject" options={SUBJECT_OPTIONS} value={metadata.subject} />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <MetaSelect label="Task" field="taskType" options={TASK_TYPE_OPTIONS} value={metadata.taskType} />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <MetaSelect label="Language" field="language" options={LANGUAGE_OPTIONS} value={metadata.language} />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <MetaSelect label="Script" field="script" options={SCRIPT_OPTIONS} value={metadata.script} />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <MetaSelect label="Writing" field="writing" options={WRITING_OPTIONS} value={metadata.writing} />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!messageId || submitStatus === 'saving'}
        className={`ml-6 flex-shrink-0 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${submitStatus === 'saved'
            ? 'bg-green-500 text-white'
            : submitStatus === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed'
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
  );
}
