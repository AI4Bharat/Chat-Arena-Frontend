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
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from !== null && from !== index) {
      dispatch(reorderAnnotations({ sessionId, participant, fromIndex: from, toIndex: index }));
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
          <span className="inline-flex items-center gap-[3px]">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
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
            {/* Drop indicator line */}
            {dropIndex === idx && dragIndexRef.current !== idx && (
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
          {dropIndex === annotations.length && (
            <div className="flex items-center gap-1 mx-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              <div className="flex-1 h-0.5 rounded-full bg-orange-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

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
