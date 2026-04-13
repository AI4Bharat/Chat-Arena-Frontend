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
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1 sm:ml-0">{label}</label>
      <select
        value={value}
        onChange={(e) => dispatch(setMetadataField({ field, value: e.target.value }))}
        className="w-full sm:w-auto text-xs bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 sm:py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-400/50 focus:border-orange-400 min-w-[110px] cursor-pointer shadow-inner appearance-none hover:border-slate-600 transition-colors"
      >
        <option value="" className="text-slate-400">Select...</option>
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
    <div className="w-full flex-shrink-0 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] relative z-30">
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-x-4 sm:gap-x-8 gap-y-4 px-4 sm:px-6 py-4">
        <MetaSelect label="Grade" field="grade" options={GRADE_OPTIONS} value={metadata.grade} />
        <MetaSelect label="Subject" field="subject" options={SUBJECT_OPTIONS} value={metadata.subject} />
        <MetaSelect label="Language" field="language" options={LANGUAGE_OPTIONS} value={metadata.language} />
        <MetaSelect label="Script" field="script" options={SCRIPT_OPTIONS} value={metadata.script} />
        <MetaSelect label="Writing" field="writing" options={WRITING_OPTIONS} value={metadata.writing} />
      </div>
    </div>
  );
}
