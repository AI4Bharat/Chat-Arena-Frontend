import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardCopy, Check, Trash2, GripVertical, Wand2, LoaderCircle } from 'lucide-react';
import {
  setActiveAnnotationId, setSelectedAnnotationId,
  updateAnnotationText, updateAnnotationType,
  deleteAnnotation, snapshotAnnotations, undoAnnotation, redoAnnotation,
} from '../store/chatSlice';
import { getTypeColor } from '../utils/typeColors';
import { TypeDropdown } from './TypeDropdown';
import { OcrTableEditor } from './OcrTableEditor';
import { parseTableText, parseTableData } from '../utils/tableUtils';

export function OcrAnnotationCard({ annotation, sessionId, participant, index, onExtractText, isExtracting = false }) {
  const dispatch = useDispatch();
  const { activeAnnotationId, selectedAnnotationId, pages, currentPageIndex } = useSelector(s => s.ocrChat);
  const currentImageUrl = pages?.[currentPageIndex]?.url;
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const isTable = annotation.type === 'table';

  const isActive   = annotation.id === activeAnnotationId;
  const isSelected = annotation.id === selectedAnnotationId;
  const textareaRef = useRef(null);
  const textSnapshotted = useRef(false);
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

  const handleTextChange = (e) => {
    if (!textSnapshotted.current) {
      textSnapshotted.current = true;
      dispatch(snapshotAnnotations({ sessionId, participant }));
    }
    dispatch(updateAnnotationText({ sessionId, participant, annotationId: annotation.id, text: e.target.value }));
  };

  const handleTextFocus = () => { textSnapshotted.current = false; };

  const handleTextKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      e.stopPropagation();
      dispatch(undoAnnotation({ sessionId, participant }));
    } else if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
      e.preventDefault();
      e.stopPropagation();
      dispatch(redoAnnotation({ sessionId, participant }));
    }
  };

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
    let text = annotation.text || '';
    if (isTable && text) {
      // TSV — pastes directly into Google Sheets / Excel
      const rows = parseTableText(text);
      text = rows.map(row => row.join('\t')).join('\n');
    }
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
            title={isTable ? (copied ? 'Copied!' : 'Copy as table') : (copied ? 'Copied!' : 'Copy text')}
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

      {/* Text / Table body */}
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
        ) : isTable ? (
          annotation.text
            ? <InlineTableView text={annotation.text} onClick={e => { e.stopPropagation(); setTableEditorOpen(true); }} />
            : <div
                onClick={e => { e.stopPropagation(); setTableEditorOpen(true); }}
                className="flex items-center justify-center gap-1.5 py-3 rounded-lg border border-dashed border-gray-200 text-[11px] text-gray-400 cursor-pointer hover:border-orange-300 hover:text-orange-400 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="10" height="10" rx="1"/><line x1="1" y1="4" x2="11" y2="4"/><line x1="1" y1="7" x2="11" y2="7"/><line x1="4" y1="4" x2="4" y2="11"/>
                </svg>
                Empty table — click to edit
              </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={annotation.text || ''}
            onChange={handleTextChange}
            onFocus={handleTextFocus}
            onKeyDown={handleTextKeyDown}
            onClick={handleSelect}
            placeholder="No text extracted"
            className="w-full text-[13px] leading-relaxed resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-300"
            rows={1}
            style={{ minHeight: '1.5rem', maxHeight: '10rem', overflow: 'auto' }}
          />
        )}
      </div>

      {tableEditorOpen && (
        <OcrTableEditor
          annotation={annotation}
          imageUrl={currentImageUrl}
          onSave={(text) => dispatch(updateAnnotationText({ sessionId, participant, annotationId: annotation.id, text }))}
          onClose={() => setTableEditorOpen(false)}
        />
      )}
    </div>
  );
}

function InlineTableView({ text, onClick }) {
  const { rows, merges } = parseTableData(text);
  if (rows.length === 0) return null;

  const isCovered = (r, c) => merges.some(m =>
    (r > m.r || (r === m.r && c > m.c)) &&
    r < m.r + m.rowspan && c >= m.c && c < m.c + m.colspan
  );
  const getMerge = (r, c) => merges.find(m => m.r === r && m.c === c);

  return (
    <div
      onClick={onClick}
      title="Click to edit table"
      className="overflow-auto rounded-lg border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors"
      style={{ maxHeight: '16rem' }}
    >
      <table className="w-full text-[11px] border-collapse">
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={r === 0 ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
              {row.map((cell, c) => {
                if (isCovered(r, c)) return null;
                const m = getMerge(r, c);
                return (
                  <td
                    key={c}
                    colSpan={m?.colspan ?? 1}
                    rowSpan={m?.rowspan ?? 1}
                    className={`px-2 py-1 border border-gray-100 truncate max-w-[8rem] ${
                      r === 0 ? 'font-semibold text-gray-700' : 'text-gray-600'
                    }`}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
