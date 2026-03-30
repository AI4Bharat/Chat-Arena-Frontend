import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil } from 'lucide-react';
import { OcrAnnotationCard } from './OcrAnnotationCard';
import { setCanvasMode, reorderAnnotations } from '../store/chatSlice';

export function OcrAnnotationPanel({ annotations, sessionId, participant, isStreaming, onExtractText, extractingIds }) {
  const dispatch = useDispatch();
  const { activeAnnotationId } = useSelector(s => s.ocrChat);
  const panelRef = useRef(null);

  const dragIndexRef = useRef(null);
  const [dropIndex, setDropIndex] = useState(null); // index to show drop line above

  // Auto-scroll to active card when hover comes from canvas
  useEffect(() => {
    if (!activeAnnotationId || !panelRef.current) return;
    const card = panelRef.current.querySelector(`[data-id="${activeAnnotationId}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeAnnotationId]);

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image so the card itself provides feedback
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e, index) => {
    if (dragIndexRef.current === null) return; // ignore external file drags
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  };

  const handleDrop = (e, index) => {
    if (dragIndexRef.current === null) return;
    e.preventDefault();
    const from = dragIndexRef.current;
    // When dragging downward, removing `from` shifts subsequent items left by 1
    const to = from < index ? index - 1 : index;
    if (from !== to) {
      dispatch(reorderAnnotations({ sessionId, participant, fromIndex: from, toIndex: to }));
    }
    dragIndexRef.current = null;
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropIndex(null);
  };

  if (!annotations || annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        {isStreaming ? (
          <OcrScanAnimation />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Pencil size={18} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No annotations yet</p>
            <button
              onClick={() => dispatch(setCanvasMode('draw'))}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              Switch to Draw mode to add boxes
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="h-full overflow-y-auto bg-gray-100/60 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400/80"
    >
      <div className="p-2.5 space-y-1.5">
        {annotations.map((ann, idx) => (
          <div
            key={ann.id}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`transition-opacity duration-100 ${dragIndexRef.current === idx ? 'opacity-40' : ''}`}
          >
            {/* Drop indicator line — hide for no-op positions (above or below dragged card) */}
            {dropIndex === idx && dragIndexRef.current !== idx && dragIndexRef.current + 1 !== idx && (
              <div className="flex items-center gap-1 mb-1.5 mx-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                <div className="flex-1 h-0.5 rounded-full bg-orange-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              </div>
            )}
            <OcrAnnotationCard
              annotation={ann}
              sessionId={sessionId}
              participant={participant}
              index={idx + 1}
              onExtractText={onExtractText}
              isExtracting={extractingIds?.has(ann.id) ?? false}
            />
          </div>
        ))}
        {/* Drop zone + indicator for "after last card" */}
        <div
          className="h-4"
          onDragOver={e => handleDragOver(e, annotations.length)}
          onDrop={e => handleDrop(e, annotations.length)}
        >
          {dropIndex === annotations.length && dragIndexRef.current !== annotations.length - 1 && (
            <div className="flex items-center gap-1 mx-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              <div className="flex-1 h-0.5 rounded-full bg-orange-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

      {isStreaming && (
        <div className="flex items-center justify-center gap-[5px] py-3">
          {[0,1,2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      )}

      {!isStreaming && (
        <div className="px-2.5 pb-3">
          <button
            onClick={() => dispatch(setCanvasMode('draw'))}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)'}
            className="w-full py-2 rounded-xl bg-white text-xs text-orange-400 hover:text-orange-500 hover:bg-orange-50/40 active:bg-orange-100/60 transition-all duration-150 flex items-center justify-center gap-1.5 font-medium"
          >
            <Pencil size={11} />
            Draw a new box
          </button>
        </div>
      )}
    </div>
  );
}

// Inject keyframes once into <head> — avoids re-inserting on every render
if (typeof document !== 'undefined' && !document.getElementById('ocr-scan-css')) {
  const el = document.createElement('style');
  el.id = 'ocr-scan-css';
  el.textContent = `
@keyframes ocr-beam {
  0%   { top: 8%;  opacity: 0; }
  8%   { opacity: 1; }
  88%  { top: 86%; opacity: 1; }
  100% { top: 86%; opacity: 0; }
}
@keyframes ocr-line-0 { 0%,15%{background:#e5e7eb}35%,100%{background:#fed7aa} }
@keyframes ocr-line-1 { 0%,25%{background:#e5e7eb}45%,100%{background:#fed7aa} }
@keyframes ocr-line-2 { 0%,38%{background:#e5e7eb}55%,100%{background:#fed7aa} }
@keyframes ocr-line-3 { 0%,50%{background:#e5e7eb}65%,100%{background:#fed7aa} }
@keyframes ocr-line-4 { 0%,62%{background:#e5e7eb}75%,100%{background:#fed7aa} }
@keyframes ocr-line-5 { 0%,74%{background:#e5e7eb}85%,100%{background:#fed7aa} }
@keyframes ocr-bracket { 0%,100%{opacity:.45} 50%{opacity:1} }
`;
  document.head.appendChild(el);
}

const LINE_WIDTHS  = [72, 50, 85, 40, 65, 55];
const SCAN_MESSAGES = ['Analyzing image', 'Drawing boxes', 'Extracting text', 'Almost there'];

function OcrScanAnimation() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % SCAN_MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 select-none">
      {/* Document card */}
      <div className="relative w-[84px] h-[108px] bg-white rounded-md overflow-hidden"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)' }}>

        {/* Corner viewfinder brackets */}
        {[['top-1.5 left-1.5','border-t border-l'],['top-1.5 right-1.5','border-t border-r'],
          ['bottom-1.5 left-1.5','border-b border-l'],['bottom-1.5 right-1.5','border-b border-r']
        ].map(([pos, border], i) => (
          <span key={i} className={`absolute ${pos} ${border} border-orange-400 w-2.5 h-2.5 rounded-[1px]`}
            style={{ animation: `ocr-bracket 2s ${i*0.1}s ease-in-out infinite` }} />
        ))}

        {/* Simulated text lines */}
        <div className="absolute inset-x-4 top-6 space-y-[7px]">
          {LINE_WIDTHS.map((w, i) => (
            <div key={i} className="h-[5px] rounded-full"
              style={{ width: `${w}%`, animation: `ocr-line-${i} 2s ease-in-out infinite` }} />
          ))}
        </div>

        {/* Scanning beam */}
        <div className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #f97316 20%, #fb923c 50%, #f97316 80%, transparent 100%)',
            boxShadow: '0 0 6px 3px rgba(249,115,22,0.45)',
            animation: 'ocr-beam 2s ease-in-out infinite',
          }} />
      </div>

      {/* Label */}
      <p className="text-[11px] font-medium text-gray-400 tracking-wide">{SCAN_MESSAGES[msgIdx]}…</p>
    </div>
  );
}
