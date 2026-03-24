import { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useBoxEditor } from '../hooks/useBoxEditor';
import { getTypeColor, hexToRgba, TYPE_OPTIONS } from '../utils/typeColors';
import { boxToRect, getHandlePositions, HANDLE_IDS } from '../utils/boxUtils';
import { setZoomLevel } from '../store/chatSlice';
import { Copy, Trash2, ChevronRight, Tag } from 'lucide-react';

const HANDLE_SIZE = 8;

function drawResizeHandles(ctx, box, color) {
  const positions = getHandlePositions(box);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (const id of HANDLE_IDS) {
    const { x, y } = positions[id];
    ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
}

function drawTypeBadge(ctx, box, typeLabel, color) {
  const [x1, y1] = box;
  const text = typeLabel.slice(0, 8);
  ctx.font = 'bold 10px system-ui, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 8;
  const bh = 14;
  const bx = x1;
  const by = Math.max(0, y1 - bh - 1);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, bx + 4, by + bh - 3);
}

/**
 * OcrCanvas — renders the document image with interactive bounding box overlay.
 *
 * Props:
 *   imageUrl       — signed URL of the document image
 *   imageWidth     — natural pixel width of the image
 *   imageHeight    — natural pixel height
 *   annotations    — Model A annotation objects from Redux
 *   annotationsB   — Model B annotations (compare mode only)
 *   sessionId      — current session ID
 *   participant    — 'modelA' | 'modelB' — which model's boxes are editable
 *   compareMode    — bool; shows both models' boxes (A=solid, B=dashed)
 */
export function OcrCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  annotations,
  annotationsB = [],
  sessionId,
  participant = 'modelA',
  compareMode = false,
  onBoxDrawn,
}) {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const prevZoomRef = useRef(null); // tracks previous zoom to compute scroll adjustment

  // Natural pixel dimensions — set once the img fires onLoad
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const { zoomLevel, activeAnnotationId, selectedAnnotationId } = useSelector(s => s.ocrChat);

  const allAnnotations = compareMode
    ? [
        ...annotations.map(a => ({ ...a, _model: 'a' })),
        ...annotationsB.map(a => ({ ...a, _model: 'b' })),
      ]
    : annotations;

  const {
    handleMouseDown, handleMouseMove, handleMouseUp,
    handleMouseLeave,
    handleContextMenu, contextMenu, contextMenuActions,
    drawingBox, cursor,
  } = useBoxEditor({
    canvasRef,
    sessionId,
    participant,
    annotations,
    zoomLevel,
    imageWidth: naturalSize.w || imageWidth,
    imageHeight: naturalSize.h || imageHeight,
    onBoxDrawn,
  });

  // ── Canvas draw ────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    allAnnotations.forEach((ann) => {
      const isActive   = ann.id === activeAnnotationId;
      const isSelected = ann.id === selectedAnnotationId;
      const color = getTypeColor(ann.type);
      const { x, y, w, h } = boxToRect(ann.box);

      ctx.fillStyle = hexToRgba(color, isActive || isSelected ? 0.15 : 0.08);
      ctx.fillRect(x, y, w, h);

      if (compareMode && ann._model === 'b') {
        ctx.setLineDash([5, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = isSelected
        ? '#f97316'
        : isActive
          ? hexToRgba(color, 0.9)
          : hexToRgba(color, 0.55);
      ctx.lineWidth = isSelected ? 2.5 : isActive ? 2 : 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      const typeLabel = ann.type || 'other';
      drawTypeBadge(ctx, ann.box, typeLabel, color);

      if (isSelected && !compareMode) {
        drawResizeHandles(ctx, ann.box, color);
      }
    });

    if (drawingBox) {
      const { x, y, w, h } = boxToRect(drawingBox);
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(59,130,246,0.08)';
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, [allAnnotations, activeAnnotationId, selectedAnnotationId, drawingBox, compareMode]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── Zoom-to-center: adjust scroll so visible center stays fixed ────────────
  useEffect(() => {
    const container = containerRef.current;
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoomLevel;

    if (!container || prev === null || prev === zoomLevel) return;

    const ratio = zoomLevel / prev;
    const cx = container.scrollLeft + container.clientWidth / 2;
    const cy = container.scrollTop + container.clientHeight / 2;
    container.scrollLeft = Math.max(0, cx * ratio - container.clientWidth / 2);
    container.scrollTop  = Math.max(0, cy * ratio - container.clientHeight / 2);
  }, [zoomLevel]);

  // ── Image load — set natural dimensions, sync canvas, auto-fit zoom ────────
  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ w, h });

    // Pin img and canvas to natural pixel dimensions
    img.style.width  = w + 'px';
    img.style.height = h + 'px';
    canvas.width  = w;
    canvas.height = h;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    // Auto-fit: scale so the image fills the container with a small margin
    const container = containerRef.current;
    if (container && w && h) {
      const pad = 32;
      const fitZoom = Math.min(
        (container.clientWidth  - pad) / w,
        (container.clientHeight - pad) / h,
        1.0,
      );
      dispatch(setZoomLevel(Math.max(0.1, Math.round(fitZoom * 100) / 100)));
      // Reset so the auto-fit zoom doesn't trigger scroll adjustment
      prevZoomRef.current = null;
    }

    redraw();
  }, [redraw, dispatch]);

  const scaledW = naturalSize.w * zoomLevel;
  const scaledH = naturalSize.h * zoomLevel;

  return (
    /*
     * Scroll container: position:absolute fills the parent panel; overflow:auto
     * gives real scrollbars when the image is zoomed larger than the viewport.
     * The inner sizing div uses block margin:auto for horizontal centering —
     * this works reliably unlike flex justify-content which can clip overflow.
     */
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-auto bg-gray-100 dark:bg-[#1e1e1e] select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar:horizontal]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/80"
    >
      {/*
       * Sizing div — explicit pixel dimensions = zoomed image size.
       * margin:auto centers it when the container is larger;
       * overflow:auto on the parent shows scrollbars when it's smaller.
       */}
      <div
        style={{
          position: 'relative',
          width:  naturalSize.w > 0 ? scaledW : '100%',
          height: naturalSize.h > 0 ? scaledH : '100%',
          margin: '16px auto',
        }}
      >
        <div
          style={{
            transform: naturalSize.w > 0 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: 'top left',
            lineHeight: 0,
            ...(naturalSize.w > 0
              ? { position: 'absolute', top: 0, left: 0, width: naturalSize.w, height: naturalSize.h }
              : {}),
          }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Document"
            onLoad={onImageLoad}
            draggable={false}
            style={{ display: 'block', userSelect: 'none', maxWidth: 'none' }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor,
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          />
        </div>
      </div>

      {/* Canvas context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed z-50 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg border border-gray-100 dark:border-[#3a3a3a] py-1 min-w-[160px] text-sm"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Duplicate */}
            <button
              onClick={() => contextMenuActions.duplicate(contextMenu.annotationId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-[#ececec] hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors"
            >
<Copy size={13} className="text-gray-400 dark:text-[#a0a0a0]" />
              Duplicate
            </button>

            {/* Change type submenu */}
            <div className="group/type relative">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-[#ececec] hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors">
                <Tag size={13} className="text-gray-400 dark:text-[#a0a0a0]" />
               <span className="flex-1 text-left">Change type</span>
               <ChevronRight size={12} className="text-gray-400 dark:text-[#a0a0a0]" />  
            </button>
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg border border-gray-100 dark:border-[#3a3a3a] py-1 min-w-[130px] hidden group-hover/type:block">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => contextMenuActions.setType(contextMenu.annotationId, opt.value)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-[#ececec] hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors text-xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: getTypeColor(opt.value) }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mmy-1 border-t border-gray-100 dark:border-[#3a3a3a]" />

            {/* Delete */}
            <button
              onClick={() => contextMenuActions.delete(contextMenu.annotationId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
