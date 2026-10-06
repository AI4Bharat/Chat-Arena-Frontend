import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ClipboardCheck, FileText, ListChecks, Upload, X } from 'lucide-react';
import { useEvaluationJob } from '../hooks/useEvaluationJob';
import { DEFAULT_MAX_MARKS, EVAL_CATEGORIES } from '../utils/evaluationCategories';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp', 'image/bmp', 'application/pdf'];
const MAX_SIZE_MB = 20;

function formatFileSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileSlot({ label, hint, required, file, onFile, icon: Icon, testId }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const stage = (f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      alert('Please upload a JPEG, PNG, TIFF, WEBP, BMP or PDF file.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }
    onFile(f);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-800">
          {label} {required ? <span className="text-orange-500">*</span> : <span className="text-xs font-normal text-gray-400">(optional)</span>}
        </span>
      </div>
      {file ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white">
          <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          </div>
          <button onClick={() => onFile(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100" title="Remove">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); stage(e.dataTransfer.files?.[0]); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            isDragOver ? 'border-orange-500 bg-orange-50' : 'border-orange-200 bg-orange-50/30 hover:border-orange-400'
          }`}
        >
          <Icon size={22} className="text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">Drop a file or <span className="text-orange-600 font-medium">browse</span></p>
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
          <Upload size={16} className="text-gray-400" />
        </div>
      )}
      <input
        ref={inputRef}
        data-testid={testId}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { stage(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}

export function EvaluationUploadInput() {
  const { submit } = useEvaluationJob();
  const { processingStatus, processingError, selectedModelId } = useSelector(s => s.evaluation);
  const [answerFile, setAnswerFile] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [maxMarks, setMaxMarks] = useState(DEFAULT_MAX_MARKS);
  const [instructions, setInstructions] = useState('');

  const busy = processingStatus === 'uploading' || processingStatus === 'processing';
  const canSubmit = answerFile && selectedModelId && maxMarks > 0 && !busy;

  return (
    <div className="w-full flex flex-col items-center gap-6 px-4 py-10">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
          Evaluate answer sheets{' '}
          <span className="bg-gradient-to-r from-orange-500 via-slate-300 to-green-600 bg-clip-text text-transparent">with AI</span>
        </h1>
        <p className="mt-3 text-slate-600">
          Upload a student's answer sheet. The model finds each answer, marks it out of {maxMarks || DEFAULT_MAX_MARKS},
          boxes specific mistakes and explains every judgement. You can then edit any box, mark or comment.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {Object.entries(EVAL_CATEGORIES).map(([key, c]) => (
            <span key={key} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: c.color, color: c.color }}>
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {busy ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-orange-600">
              {processingStatus === 'uploading' ? 'Uploading documents…' : 'Starting evaluation…'}
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <FileSlot
                label="Student answer sheet" required icon={FileText} file={answerFile} onFile={setAnswerFile}
                hint={`Image or PDF (each page is evaluated) · max ${MAX_SIZE_MB}MB`} testId="answer-sheet-input"
              />
              <FileSlot
                label="Question paper / answer key" icon={ListChecks} file={referenceFile} onFile={setReferenceFile}
                hint="Gives the model the questions and the expected answers" testId="reference-input"
              />
              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 items-start">
                <label htmlFor="eval-max-marks" className="text-sm font-medium text-gray-800 pt-2">Marks per question</label>
                <div>
                  <input
                    id="eval-max-marks" type="number" min={1} max={100} step={0.5} value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="eval-instructions" className="block text-sm font-medium text-gray-800 mb-1.5">
                  Instructions for the evaluator <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="eval-instructions" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Class 6. Give method marks even when the final answer is wrong. Deduct 1 mark for missing units."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button
                disabled={!canSubmit}
                onClick={() => submit({ answerFile, referenceFile, maxMarks, instructions })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-semibold"
              >
                <ClipboardCheck size={16} /> Evaluate answers
              </button>
              {!selectedModelId && <p className="mt-2 text-xs text-center text-gray-400">Choose an evaluation model above.</p>}
            </div>
          </>
        )}
      </div>

      {processingError && <p className="text-sm text-red-500 max-w-md text-center">{processingError}</p>}
    </div>
  );
}
