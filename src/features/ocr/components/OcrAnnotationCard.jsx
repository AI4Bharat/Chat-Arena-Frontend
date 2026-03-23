import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardCopy, Check, Trash2, GripVertical, Wand2, LoaderCircle } from 'lucide-react';
import {
  setActiveAnnotationId, setSelectedAnnotationId,
  updateAnnotationText, updateAnnotationType,
  deleteAnnotation,
} from '../store/chatSlice';
import { getTypeColor } from '../utils/typeColors';
import { TypeDropdown } from './TypeDropdown';

export function OcrAnnotationCard({ annotation, sessionId, participant, index, onExtractText, isExtracting = false }) {
  const dispatch = useDispatch();
  const { activeAnnotationId, selectedAnnotationId } = useSelector(s => s.ocrChat);

  const isActive   = annotation.id === activeAnnotationId;
  const isSelected = annotation.id === selectedAnnotationId;
  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [localExtracting, setLocalExtracting] = useState(false);
  const extracting = isExtracting || localExtracting;
  const color = getTypeColor(annotation.type);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [annotation.text, extracting]);

  const handleMouseEnter = () => dispatch(setActiveAnnotationId(annotation.id));
  const handleMouseLeave = () => dispatch(setActiveAnnotationId(null));
  const handleClick      = () => dispatch(setSelectedAnnotationId(annotation.id));

  const handleTextChange = (e) =>
    dispatch(updateAnnotationText({ sessionId, participant, annotationId: annotation.id, text: e.target.value }));

  const handleSelect = () => dispatch(setSelectedAnnotationId(annotation.id));

  const handleTypeChange = (type) =>
    dispatch(updateAnnotationType({ sessionId, participant, annotationId: annotation.id, type }));

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch(deleteAnnotation({ sessionId, participant, annotationId: annotation.id }));
  };

  const handleExtractText = async (e) => {
    e.stopPropagation();
    if (!onExtractText || extracting) return;
    setLocalExtracting(true);
    try {
      await onExtractText(annotation.id, annotation.box);
    } finally {
      setLocalExtracting(false);
    }
  };

  const handleCopyText = (e) => {
    e.stopPropagation();
    const text = annotation.text || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      data-id={annotation.id}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-xl bg-white transition-all duration-200"
      style={
        isSelected
          ? { boxShadow: `0 0 0 2px ${color}, 0 4px 20px ${color}40, 0 1px 3px rgba(0,0,0,0.06)` }
          : isActive
          ? { boxShadow: '0 1px 6px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)' }
          : { boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }
      }
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
        {/* Drag handle */}
        <span
          className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
          onMouseDown={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </span>

        {/* Order number */}
        {index != null && (
          <span className="flex-shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold tabular-nums border border-gray-300 text-gray-400 bg-transparent">
            {index}
          </span>
        )}

        {/* Type label — carries the color */}
        <TypeDropdown
          value={annotation.type || 'paragraph'}
          onChange={handleTypeChange}
          compact
        />

        {/* Action buttons */}
        <div className={`ml-auto flex items-center gap-0.5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {onExtractText && (
            <button
              title="Extract text from this region"
              onClick={handleExtractText}
              disabled={extracting}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-40"
            >
              {extracting ? <LoaderCircle size={12} className="animate-spin" /> : <Wand2 size={12} />}
            </button>
          )}
          <button
            title={copied ? 'Copied!' : 'Copy text'}
            onClick={handleCopyText}
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${
              copied ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
          </button>
          <button
            title="Delete"
            onClick={handleDelete}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Text area */}
      <div className="px-3 pb-2.5">
        {extracting ? (
          <div className="flex items-center gap-[4px] py-1 min-h-[1.5rem]">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={annotation.text || ''}
            onChange={handleTextChange}
            onClick={handleSelect}
            placeholder="No text extracted"
            className="w-full text-[13px] leading-relaxed resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-300"
            rows={1}
            style={{ minHeight: '1.5rem', maxHeight: '10rem', overflow: 'auto' }}
          />
        )}
      </div>
    </div>
  );
}
