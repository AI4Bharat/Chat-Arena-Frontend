import { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { getEduvizTypeColor, hexToRgba } from '../utils/eduvizTypeColors';
import {
  boxToRect, getHandlePositions, HANDLE_IDS,
  normaliseBox, clampBox, toNaturalCoords,
  getHandleAtPoint, pointInBox, applyResize,
  HANDLE_CURSORS,
} from '../../ocr/utils/boxUtils';
import { XCircle, X } from 'lucide-react';
import {
  setZoomLevel, setCanvasMode,
  setActiveAnnotationId, setSelectedAnnotationId,
  addAnnotation, deleteAnnotation, updateAnnotationBox,
  undoAnnotation, redoAnnotation, toggleSidebar, toggleAnnotationLabel,
} from '../store/eduvizSlice';
import {
  setSelectedAnnotationId as setOcrSelectedId,
  setActiveAnnotationId as setOcrActiveId,
} from '../../ocr/store/chatSlice';
// Note: EDUVIZ_TYPE_OPTIONS imported from eduvizTypeColors if needed for context menu
import { Copy, Trash2, ChevronRight, Tag } from 'lucide-react';

const HANDLE_SIZE = 8;

// ── Drawing helpers ──────────────────────────────────────────────────────────

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

  return bw + 2;
}


/**
 * EduVizCanvas — self-contained canvas for the EduViz Benchmark.
 * 
 * Supports:
 *   - Bounding box drawing (rect)
 *   - Freehand drawing (polyline)
 *   - Touch/stylus via pointer events
 *   - Box move (drag) and resize (handles)
 *   - Delete via keyboard or context menu
 * 
 * Reads/writes directly from eduviz Redux store (no ocrChat dependency).
 */
export function EduVizCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  annotations,
  sessionId,
  participant = 'modelA',
}) {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const prevZoomRef = useRef(null);

  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const { zoomLevel, activeAnnotationId, selectedAnnotationId, canvasMode, drawType, drawMode } =
    useSelector(s => s.eduviz);

  // ── Interaction state ───────────────────────────────────────────────────
  const [drawingBox, setDrawingBox] = useState(null);
  const [cursor, setCursor] = useState('default');
  const [contextMenu, setContextMenu] = useState(null);

  const interactionRef = useRef({
    mode: 'idle', // 'idle' | 'drawing' | 'freehand' | 'dragging' | 'resizing'
    anchorPt: null,
    anchorBox: null,
    handle: null,
    lastPt: null,
  });

  // ── Coordinate helpers ─────────────────────────────────────────────────
  const getCoords = useCallback((e) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    return { x, y };
  }, [zoomLevel]);

  const findAnnotationAt = useCallback((pt) => {
    return [...annotations].reverse().find(ann => ann.box && pointInBox(pt, ann.box)) || null;
  }, [annotations]);

  const findSelectedAnnotation = useCallback(() => {
    return annotations.find(a => a.id === selectedAnnotationId) || null;
  }, [annotations, selectedAnnotationId]);

  const findUIHit = useCallback((pt) => {
    return null;
  }, []);

  // ── Canvas redraw ──────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((ann) => {
      const isActive = ann.id === activeAnnotationId;
      const isSelected = ann.id === selectedAnnotationId;
      const primaryType = ann.labels?.[0] || ann.type || 'other';
      const color = getEduvizTypeColor(primaryType);

      // Bounding box annotation
      if (!ann.box) return;
      const { x, y, w, h } = boxToRect(ann.box);

      ctx.fillStyle = hexToRgba(color, isActive || isSelected ? 0.15 : 0.08);
      ctx.fillRect(x, y, w, h);

      ctx.setLineDash([]);
      ctx.strokeStyle = isSelected
        ? color
        : isActive
          ? hexToRgba(color, 0.9)
          : hexToRgba(color, 0.55);
      ctx.lineWidth = isSelected ? 3 : isActive ? 2 : 1.5;
      ctx.strokeRect(x, y, w, h);

      // Label badges
      const labels = ann.labels || (ann.type ? [ann.type] : ['other']);
      let badgeOffsetX = 0;
      labels.forEach(label => {
        const labelColor = getEduvizTypeColor(label);
        badgeOffsetX += drawTypeBadge(ctx, ann.box, label, labelColor, badgeOffsetX);
      });

      if (isSelected) {
        drawResizeHandles(ctx, ann.box, color);
      }
    });

    // Draw in-progress bounding box
    if (drawingBox) {
      const liveBox = normaliseBox([drawingBox.anchor.x, drawingBox.anchor.y, drawingBox.current.x, drawingBox.current.y]);
      const { x, y, w, h } = boxToRect(liveBox);
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = getEduvizTypeColor(drawType) || '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = hexToRgba(getEduvizTypeColor(drawType) || '#3b82f6', 0.08);
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([]);
    }

  }, [annotations, activeAnnotationId, selectedAnnotationId, drawingBox, drawType]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Zoom ───────────────────────────────────────────────────────────────
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);
  const pendingScrollRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoomLevel;
    if (!container || prev === null || prev === zoomLevel) return;

    if (pendingScrollRef.current) {
      container.scrollLeft = pendingScrollRef.current.scrollLeft;
      container.scrollTop = pendingScrollRef.current.scrollTop;
      pendingScrollRef.current = null;
    } else {
      const ratio = zoomLevel / prev;
      const cx = container.scrollLeft + container.clientWidth / 2;
      const cy = container.scrollTop + container.clientHeight / 2;
      container.scrollLeft = Math.max(0, cx * ratio - container.clientWidth / 2);
      container.scrollTop = Math.max(0, cy * ratio - container.clientHeight / 2);
    }
  }, [zoomLevel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const current = zoomLevelRef.current;
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const next = Math.min(3.0, Math.max(0.1, current * factor));
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left + container.scrollLeft;
      const cursorY = e.clientY - rect.top + container.scrollTop;
      const ratio = next / current;
      pendingScrollRef.current = {
        scrollLeft: Math.max(0, cursorX * ratio - (e.clientX - rect.left)),
        scrollTop: Math.max(0, cursorY * ratio - (e.clientY - rect.top)),
      };
      dispatch(setZoomLevel(next));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [dispatch]);

  // ── Image load ─────────────────────────────────────────────────────────
  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ w, h });
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const container = containerRef.current;
    if (container && w && h) {
      const pad = 32;
      const fitZoom = Math.min(
        (container.clientWidth - pad) / w,
        (container.clientHeight - pad) / h,
        1.0,
      );
      dispatch(setZoomLevel(Math.max(0.1, Math.round(fitZoom * 100) / 100)));
      prevZoomRef.current = null;
    }
    redraw();
  }, [redraw, dispatch]);

  // ── Pointer events (unified mouse + touch + stylus) ────────────────────
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== undefined) return;
    const pt = getCoords(e);
    const inter = interactionRef.current;

    // 1. Check for UI Hits (Bin, X Buttons) FIRST
    const uiHit = findUIHit(pt);
    if (uiHit) {
      if (uiHit.type === 'bin') {
        dispatch(deleteAnnotation({ sessionId, participant, annotationId: uiHit.annotationId }));
      } else if (uiHit.type === 'labelX') {
        dispatch(toggleAnnotationLabel({
          sessionId, participant, annotationId: uiHit.annotationId, label: uiHit.label
        }));
      }
      return;
    }

    if (canvasMode === 'draw') {
      inter.mode = 'drawing';
      inter.anchorPt = pt;
      setDrawingBox({ anchor: pt, current: pt });
      return;
    }

    if (canvasMode === 'pan') {
      inter.mode = 'panning';
      inter.lastPt = { x: e.clientX, y: e.clientY };
      return;
    }

    // SELECT mode
    const selectedAnn = findSelectedAnnotation();
    if (selectedAnn && selectedAnn.box) {
      const handle = getHandleAtPoint(selectedAnn.box, pt);
      if (handle) {
        inter.mode = 'resizing';
        inter.handle = handle;
        inter.anchorBox = [...selectedAnn.box];
        inter.lastPt = pt;
        return;
      }
    }

    const hitAnn = findAnnotationAt(pt);
    if (hitAnn) {
      dispatch(setSelectedAnnotationId(hitAnn.id));
      dispatch(setActiveAnnotationId(hitAnn.id));
      dispatch(setOcrSelectedId(hitAnn.id)); // Sync to OCR
      dispatch(setOcrActiveId(hitAnn.id));    // Sync to OCR
      dispatch(toggleSidebar(true));
      if (hitAnn.box) {
        inter.mode = 'dragging';
        inter.anchorBox = [...hitAnn.box];
        inter.lastPt = pt;
      } else {
        // Just select, no dragging for freehand for now (to avoid crash)
        inter.mode = 'idle';
      }
    } else {
      dispatch(setSelectedAnnotationId(null));
      dispatch(setActiveAnnotationId(null));
      dispatch(setOcrSelectedId(null));
      dispatch(setOcrActiveId(null));

      // Implicit panning if clicking on white space in SELECT mode + container has scrollbars
      const container = containerRef.current;
      const canScroll = container && (container.scrollWidth > container.clientWidth + 1 || container.scrollHeight > container.clientHeight + 1);

      if (canvasMode === 'select' && canScroll) {
        inter.mode = 'panning';
        inter.lastPt = { x: e.clientX, y: e.clientY };
      } else {
        inter.mode = 'idle';
      }
    }
  }, [canvasMode, drawMode, getCoords, findSelectedAnnotation, findAnnotationAt, findUIHit, sessionId, participant, dispatch]);

  const handlePointerMove = useCallback((e) => {
    const inter = interactionRef.current;
    // Only prevent default during active interactions (drawing, dragging, resizing)
    // In idle mode, let the browser handle scrolling/panning
    if (inter.mode !== 'idle') e.preventDefault();
    const pt = getCoords(e);



    if (inter.mode === 'drawing') {
      setDrawingBox(prev => prev ? { anchor: prev.anchor, current: pt } : null);
      setCursor('crosshair');
      return;
    }

    if (inter.mode === 'panning') {
      const dx = e.clientX - inter.lastPt.x;
      const dy = e.clientY - inter.lastPt.y;
      if (containerRef.current) {
        containerRef.current.scrollLeft -= dx;
        containerRef.current.scrollTop -= dy;
      }
      inter.lastPt = { x: e.clientX, y: e.clientY };
      setCursor('grabbing');
      return;
    }

    if (inter.mode === 'resizing') {
      const delta = { dx: pt.x - (inter.lastPt?.x || pt.x), dy: pt.y - (inter.lastPt?.y || pt.y) };
      inter.lastPt = pt;
      if (!inter.anchorBox) return;

      const newBox = clampBox(
        applyResize(inter.anchorBox, inter.handle, delta),
        naturalSize.w || imageWidth, naturalSize.h || imageHeight
      );
      inter.anchorBox = newBox;
      dispatch(updateAnnotationBox({
        sessionId, participant, annotationId: selectedAnnotationId, box: newBox
      }));
      setCursor(HANDLE_CURSORS[inter.handle]);
      return;
    }

    if (inter.mode === 'dragging') {
      const delta = { dx: pt.x - (inter.lastPt?.x || pt.x), dy: pt.y - (inter.lastPt?.y || pt.y) };
      inter.lastPt = pt;
      if (!inter.anchorBox) return;

      const [x1, y1, x2, y2] = inter.anchorBox;
      const newBox = clampBox(
        [x1 + delta.dx, y1 + delta.dy, x2 + delta.dx, y2 + delta.dy],
        naturalSize.w || imageWidth, naturalSize.h || imageHeight
      );
      inter.anchorBox = newBox;
      dispatch(updateAnnotationBox({
        sessionId, participant, annotationId: selectedAnnotationId, box: newBox
      }));
      setCursor('move');
      return;
    }

    // Idle hover
    if (canvasMode === 'draw') {
      setCursor('crosshair');
      return;
    }

    const selectedAnn = findSelectedAnnotation();
    if (selectedAnn && selectedAnn.box) {
      const handle = getHandleAtPoint(selectedAnn.box, pt);
      if (handle) { setCursor(HANDLE_CURSORS[handle]); return; }
    }

    const hitAnn = findAnnotationAt(pt);
    if (hitAnn) {
      dispatch(setActiveAnnotationId(hitAnn.id));
      setCursor('move');
    } else {
      dispatch(setActiveAnnotationId(null));
      const container = containerRef.current;
      const canScroll = container && (container.scrollWidth > container.clientWidth + 1 || container.scrollHeight > container.clientHeight + 1);
      setCursor((canScroll && (canvasMode === 'pan' || canvasMode === 'select')) ? 'grab' : 'default');
    }
  }, [
    getCoords, canvasMode, drawMode, findSelectedAnnotation, findAnnotationAt,
    selectedAnnotationId, sessionId, participant, naturalSize, imageWidth, imageHeight, dispatch,
  ]);

  const handlePointerUp = useCallback((e) => {
    const pt = getCoords(e);
    const inter = interactionRef.current;


    if (inter.mode === 'drawing' && drawingBox && inter.anchorPt) {
      const raw = normaliseBox([inter.anchorPt.x, inter.anchorPt.y, pt.x, pt.y]);
      const box = clampBox(raw, naturalSize.w || imageWidth, naturalSize.h || imageHeight);
      const w = box[2] - box[0];
      const h = box[3] - box[1];

      if (w > 5 && h > 5) {
        const newAnnotation = {
          id: `r${uuidv4().slice(0, 8)}`,
          annotationType: 'bbox',
          box,
          text: '',
          type: drawType || 'Error',
          labels: drawType ? [drawType] : [],
          confidence: 1.0,
          page: 1,
        };
        dispatch(addAnnotation({ sessionId, participant, annotation: newAnnotation }));
        // Atomic selection of the new box across both state slices
        dispatch(setSelectedAnnotationId(newAnnotation.id));
        dispatch(setActiveAnnotationId(newAnnotation.id));
        dispatch(setOcrSelectedId(newAnnotation.id));
        dispatch(setOcrActiveId(newAnnotation.id));

        // Return to select mode so user can immediately manipulation the box
        dispatch(setCanvasMode('select'));
        dispatch(toggleSidebar(true));
      }
      setDrawingBox(null);
    }

    inter.mode = 'idle';
    inter.anchorPt = null;
    inter.anchorBox = null;
    inter.handle = null;
    inter.lastPt = null;
  }, [getCoords, drawingBox, drawType, naturalSize, imageWidth, imageHeight, sessionId, participant, dispatch]);

  const handlePointerLeave = useCallback(() => {
    const inter = interactionRef.current;
    if (inter.mode === 'drawing') {
      setDrawingBox(null);
      inter.mode = 'idle';
    }
    dispatch(setActiveAnnotationId(null));
  }, [dispatch]);

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        dispatch(undoAnnotation({ sessionId, participant }));
        return;
      }
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault();
        dispatch(redoAnnotation({ sessionId, participant }));
        return;
      }
      if (!selectedAnnotationId) return;
      if (['Delete', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        dispatch(deleteAnnotation({ sessionId, participant, annotationId: selectedAnnotationId }));
      } else if (e.key === 'Escape') {
        dispatch(setSelectedAnnotationId(null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, sessionId, participant, dispatch]);

  // ── Context Menu ───────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const pt = getCoords(e);
    const hitAnn = findAnnotationAt(pt);
    if (hitAnn) {
      dispatch(setSelectedAnnotationId(hitAnn.id));
      dispatch(setActiveAnnotationId(hitAnn.id));
      const MENU_W = 180, MENU_H = 120;
      const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
      const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
      setContextMenu({ x, y, annotationId: hitAnn.id });
    } else {
      setContextMenu(null);
    }
  }, [getCoords, findAnnotationAt, dispatch]);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    const t = setTimeout(() => window.addEventListener('click', handler), 0);
    return () => { clearTimeout(t); window.removeEventListener('click', handler); };
  }, [contextMenu]);


  const scaledW = naturalSize.w * zoomLevel;
  const scaledH = naturalSize.h * zoomLevel;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-auto bg-gray-100 select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar:horizontal]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/80"
      style={{ touchAction: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          width: naturalSize.w > 0 ? scaledW : '100%',
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
            alt="Student Sample"
            onLoad={onImageLoad}
            draggable={false}
            style={{ display: 'block', userSelect: 'none', maxWidth: 'none' }}
          />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={handleContextMenu}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor,
              touchAction: 'none',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] text-sm"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Delete */}
            <button
              onClick={() => {
                dispatch(deleteAnnotation({ sessionId, participant, annotationId: contextMenu.annotationId }));
                setContextMenu(null);
              }}
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
