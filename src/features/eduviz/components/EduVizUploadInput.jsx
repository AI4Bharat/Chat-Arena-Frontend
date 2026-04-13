import { useRef, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Upload, FileText, Image, X, ScanText, ChevronRight, BookOpen, PenTool, LayoutList } from 'lucide-react';
import { useEduVizJob } from '../hooks/useEduVizJob';
import { TASK_TYPES } from '../utils/rubricConfig';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp', 'image/bmp', 'application/pdf'];
const MAX_SIZE_MB = 20;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadZone({ label, icon: Icon, description, file, previewUrl, onFile, onClear, isDragOver, onDragOver, onDragLeave, onDrop, inputRef }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      {file ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                <FileText size={18} className="text-orange-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={onClear}
              className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 cursor-pointer ${isDragOver
            ? 'border-orange-500 bg-orange-50 scale-[1.01]'
            : 'border-orange-300 bg-orange-50/30 hover:border-orange-500 hover:bg-orange-50'
            }`}
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2 text-orange-400">
              <Image size={24} />
            </div>
            <p className="text-xs font-medium text-gray-600">{description}</p>
            <p className="text-[10px] text-gray-400">PNG, JPEG, TIFF, PDF · max {MAX_SIZE_MB}MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function EduVizUploadInput() {
  const refFileInputRef = useRef(null);
  const studentFileInputRef = useRef(null);
  const { submitImages } = useEduVizJob();
  const { processingStatus, processingError } = useSelector(s => s.eduviz);

  const [referenceFile, setReferenceFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [taskType, setTaskType] = useState('Middle - Writing');
  const [refPreviewUrl, setRefPreviewUrl] = useState(null);
  const [studentPreviewUrl, setStudentPreviewUrl] = useState(null);
  const [refDragOver, setRefDragOver] = useState(false);
  const [studentDragOver, setStudentDragOver] = useState(false);

  useEffect(() => {
    return () => {
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
      if (studentPreviewUrl) URL.revokeObjectURL(studentPreviewUrl);
    };
  }, [refPreviewUrl, studentPreviewUrl]);

  const stageFile = useCallback((file, setFile, setPreview) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please upload a JPEG, PNG, TIFF, WEBP, BMP, or PDF file.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(file);
    if (file.type !== 'application/pdf') {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }, []);

  const handleStartAnnotation = async () => {
    if (!referenceFile || !studentFile) return;
    await submitImages(referenceFile, studentFile, taskType);
  };

  const isProcessing = processingStatus === 'uploading' || processingStatus === 'processing';
  const canStart = referenceFile && studentFile && !isProcessing;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 p-6">
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-2">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 mb-4 shadow-lg shadow-orange-200">
          <ScanText size={28} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
          EduViz{' '}
          <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Benchmark
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-sm md:text-md text-slate-600">
          Upload reference material and student handwriting for manual annotation and evaluation.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl">
        {isProcessing ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-orange-600">
              {processingStatus === 'uploading' ? 'Uploading documents…' : 'Setting up workspace…'}
            </p>
            <p className="text-xs text-orange-400">This may take a few seconds</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Task Type selector */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-3">
                <LayoutList size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Task Category</span>
              </div>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-700 shadow-sm"
              >
                {TASK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Dual upload zones */}
            <div className="flex flex-col sm:flex-row gap-4 p-5">
              <UploadZone
                label="Reference Material"
                icon={BookOpen}
                description="Drop reference image here"
                file={referenceFile}
                previewUrl={refPreviewUrl}
                onFile={(f) => stageFile(f, setReferenceFile, setRefPreviewUrl)}
                onClear={() => { setReferenceFile(null); setRefPreviewUrl(null); if (refFileInputRef.current) refFileInputRef.current.value = ''; }}
                isDragOver={refDragOver}
                onDragOver={(e) => { e.preventDefault(); setRefDragOver(true); }}
                onDragLeave={() => setRefDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setRefDragOver(false); if (e.dataTransfer.files?.[0]) stageFile(e.dataTransfer.files[0], setReferenceFile, setRefPreviewUrl); }}
                inputRef={refFileInputRef}
              />
              <div className="hidden sm:flex items-center justify-center">
                <div className="w-px h-20 bg-gray-200"></div>
              </div>
              <UploadZone
                label="Student's Handwriting"
                icon={PenTool}
                description="Drop student sample here"
                file={studentFile}
                previewUrl={studentPreviewUrl}
                onFile={(f) => stageFile(f, setStudentFile, setStudentPreviewUrl)}
                onClear={() => { setStudentFile(null); setStudentPreviewUrl(null); if (studentFileInputRef.current) studentFileInputRef.current.value = ''; }}
                isDragOver={studentDragOver}
                onDragOver={(e) => { e.preventDefault(); setStudentDragOver(true); }}
                onDragLeave={() => setStudentDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setStudentDragOver(false); if (e.dataTransfer.files?.[0]) stageFile(e.dataTransfer.files[0], setStudentFile, setStudentPreviewUrl); }}
                inputRef={studentFileInputRef}
              />
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleStartAnnotation}
                disabled={!canStart}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-100 active:scale-[0.98] transition-all"
              >
                <ScanText size={16} />
                Start Annotation
                <ChevronRight size={15} className="opacity-70" />
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={refFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => { if (e.target.files?.[0]) stageFile(e.target.files[0], setReferenceFile, setRefPreviewUrl); }}
        className="hidden"
      />
      <input
        ref={studentFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => { if (e.target.files?.[0]) stageFile(e.target.files[0], setStudentFile, setStudentPreviewUrl); }}
        className="hidden"
      />
    </div>
  );
}
