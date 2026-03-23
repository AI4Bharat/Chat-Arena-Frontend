import { useRef, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Upload, FileText, Image, X, ScanText, ChevronRight } from 'lucide-react';
import { useOcrJob } from '../hooks/useOcrJob';
import OpenAiIcon from '../../../shared/icons/OpenAiIcon';
import GeminiIcon from '../../../shared/icons/GeminiIcon';
import LlamaIcon from '../../../shared/icons/LlamaIcon';
import QwenIcon from '../../../shared/icons/QwenIcon';
import AI4Bicon from '../../../shared/icons/AI4Bicon';
import IbmIcon from '../../../shared/icons/IbmIcon';
import SarvamIcon from '../../../shared/icons/SarvamIcon';
import ClaudeIcon from '../../../shared/icons/ClaudeIcon';

const ProviderIcon = ({ icon: Icon, className = 'h-6 w-6' }) => (
  <div className={`flex items-center justify-center text-orange-500/80 ${className}`}>
    <Icon className="h-full w-full" strokeWidth={1.5} />
  </div>
);

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-orange-500' : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp', 'image/bmp', 'application/pdf'];
const MAX_SIZE_MB = 20;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OcrUploadInput() {
  const fileInputRef = useRef(null);
  const { submitImage } = useOcrJob();
  const { processingStatus, processingError } = useSelector(s => s.ocrChat);

  const [generateBoxes, setGenerateBoxes] = useState(true);
  const [generateText, setGenerateText] = useState(true);

  // Preview stage — file selected but not yet submitted
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Clean up object URL when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const stageFile = useCallback((file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please upload a JPEG, PNG, TIFF, WEBP, BMP, or PDF file.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    if (file.type !== 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await submitImage(selectedFile, { generateBoxes, generateText });
  };

  const handleInputChange = (e) => {
    if (e.target.files?.[0]) stageFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) stageFile(e.dataTransfer.files[0]);
  }, [stageFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const isProcessing = processingStatus === 'uploading' || processingStatus === 'processing';

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-2">
        <div className="flex items-center space-x-4 mb-6">
          <ProviderIcon icon={OpenAiIcon} />
          <ProviderIcon icon={ClaudeIcon} className="h-7 w-7" />
          <ProviderIcon icon={QwenIcon} />
          <ProviderIcon icon={AI4Bicon} className="h-7 w-7" />
          <ProviderIcon icon={GeminiIcon} />
          <ProviderIcon icon={LlamaIcon} className="h-7 w-7" />
          <ProviderIcon icon={IbmIcon} className="h-11 w-11" />
          <ProviderIcon icon={SarvamIcon} className="h-6 w-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
          Find the{' '}
          <span className="bg-gradient-to-r from-orange-500 via-slate-300 to-green-600 bg-clip-text text-transparent">
            best AI for India
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-md md:text-lg text-slate-600">
          Compare document layout analysis across top AI models for Indian language documents.
        </p>
        <p className="max-w-3xl text-md md:text-lg text-slate-600">
          See how well they detect headings, paragraphs, tables, and figures — and help shape India's OCR leaderboard.
        </p>
      </div>

      {/* ── Main card ── */}
      <div className="w-full max-w-lg">

        {/* Processing state */}
        {isProcessing ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-orange-600">
              {processingStatus === 'uploading' ? 'Uploading document…' : 'Running OCR…'}
            </p>
            <p className="text-xs text-orange-400">This may take a few seconds</p>
          </div>

        /* File staged — preview + options + submit */
        ) : selectedFile ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* File header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                  <FileText size={22} className="text-orange-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={clearFile}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X size={15} />
              </button>
            </div>

            {/* Options */}
            <div className="divide-y divide-gray-100">
              <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-800">Generate boxes</span>
                  <span className="text-xs text-gray-400">Automatically detect layout regions</span>
                </div>
                <Toggle checked={generateBoxes} onChange={setGenerateBoxes} />
              </label>
              <label className={`flex items-center justify-between px-4 py-3 transition-opacity ${generateBoxes ? 'cursor-pointer' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-800">Generate text within</span>
                  <span className="text-xs text-gray-400">Transcribe text inside each detected region</span>
                </div>
                <Toggle checked={generateBoxes && generateText} onChange={setGenerateText} disabled={!generateBoxes} />
              </label>
            </div>

            {/* Submit button */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <ScanText size={16} />
                Analyse Document
                <ChevronRight size={15} className="opacity-70" />
              </button>
            </div>
          </div>

        /* Idle — drop zone */
        ) : (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? 'border-orange-500 bg-orange-50 scale-[1.01]'
                : 'border-orange-300 bg-orange-50/30 hover:border-orange-500 hover:bg-orange-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-3 text-orange-400">
                <Image size={36} />
                <FileText size={36} />
              </div>
              <p className="text-base font-medium text-gray-700">
                Drop a document here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPEG, TIFF, WEBP, BMP, PDF &nbsp;·&nbsp; max {MAX_SIZE_MB}MB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Upload size={15} />
                Choose File
              </button>
            </div>
          </div>
        )}
      </div>

      {processingError && (
        <p className="text-sm text-red-500 max-w-md text-center">{processingError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
