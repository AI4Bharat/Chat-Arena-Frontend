import { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useBoxEditor } from '../hooks/useBoxEditor';
import { getTypeColor, hexToRgba, TYPE_OPTIONS } from '../utils/typeColors';
import { getEduvizTypeColor } from '../../eduviz/utils/eduvizTypeColors';
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

function drawTypeBadge(ctx, box, typeLabel, color, offsetX = 0) {
  const [x1, y1] = box;
  const text = typeLabel.replace('_error', '').slice(0, 10);
  ctx.font = 'bold 9px system-ui, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 8;
  const bh = 14;
  const bx = x1 + offsetX;
  const by = Math.max(0, y1 - bh - 1);

  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 2);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, bx + 4, by + bh - 4);
  return bw + 2; // return width + gap
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
      const primaryType = ann.labels?.[0] || ann.type || 'other';
      const color = getEduvizTypeColor(primaryType) !== '#6b7280' 
        ? getEduvizTypeColor(primaryType) 
        : getTypeColor(primaryType);
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

      const labels = ann.labels || (ann.type ? [ann.type] : ['other']);
      let badgeOffsetX = 0;
      labels.forEach(label => {
        // Try both OCR and EduViz color maps
        const labelColor = getEduvizTypeColor(label) !== '#6b7280' 
          ? getEduvizTypeColor(label) 
          : getTypeColor(label);
        badgeOffsetX += drawTypeBadge(ctx, ann.box, label, labelColor, badgeOffsetX);
      });

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

  // ── Zoom-to-cursor: adjust scroll so the point under the cursor stays fixed ─
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);
  const pendingScrollRef = useRef(null); // {scrollLeft, scrollTop} to apply after zoom re-render

  useEffect(() => {
    const container = containerRef.current;
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoomLevel;

    if (!container || prev === null || prev === zoomLevel) return;

    if (pendingScrollRef.current) {
      // cursor-centered: use pre-computed scroll from wheel handler
      container.scrollLeft = pendingScrollRef.current.scrollLeft;
      container.scrollTop  = pendingScrollRef.current.scrollTop;
      pendingScrollRef.current = null;
    } else {
      // fallback: keep visible center fixed (toolbar buttons, keyboard)
      const ratio = zoomLevel / prev;
      const cx = container.scrollLeft + container.clientWidth / 2;
      const cy = container.scrollTop + container.clientHeight / 2;
      container.scrollLeft = Math.max(0, cx * ratio - container.clientWidth / 2);
      container.scrollTop  = Math.max(0, cy * ratio - container.clientHeight / 2);
    }
  }, [zoomLevel]);

  // ── Pinch / Ctrl+scroll → image zoom (intercepts browser page zoom) ────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const current = zoomLevelRef.current;
      const factor  = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const next    = Math.min(3.0, Math.max(0.1, current * factor));

      // Compute cursor-relative scroll position before zoom changes
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left + container.scrollLeft;
      const cursorY = e.clientY - rect.top  + container.scrollTop;
      const ratio   = next / current;
      pendingScrollRef.current = {
        scrollLeft: Math.max(0, cursorX * ratio - (e.clientX - rect.left)),
        scrollTop:  Math.max(0, cursorY * ratio - (e.clientY - rect.top)),
      };

      dispatch(setZoomLevel(next));
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [dispatch]);

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
      className="absolute inset-0 overflow-auto bg-gray-100 select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar:horizontal]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/80"
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
            className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] text-sm"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Duplicate */}
            <button
              onClick={() => contextMenuActions.duplicate(contextMenu.annotationId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy size={13} className="text-gray-400" />
              Duplicate
            </button>

            {/* Change type submenu */}
            <div className="group/type relative">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                <Tag size={13} className="text-gray-400" />
                <span className="flex-1 text-left">Change type</span>
                <ChevronRight size={12} className="text-gray-400" />
              </button>
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px] hidden group-hover/type:block">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => contextMenuActions.setType(contextMenu.annotationId, opt.value)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors text-xs"
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

            <div className="my-1 border-t border-gray-100" />

            {/* Delete */}
            <button
              onClick={() => contextMenuActions.delete(contextMenu.annotationId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50 transition-colors"
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
