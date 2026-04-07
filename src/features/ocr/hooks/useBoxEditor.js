import { useRef, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  setActiveAnnotationId, setSelectedAnnotationId,
  updateAnnotationBox, deleteAnnotation, duplicateAnnotation, addAnnotation,
  setCanvasMode, updateAnnotationType, undoAnnotation, redoAnnotation,
} from '../store/chatSlice';
import {
  getHandleAtPoint, pointInBox, toNaturalCoords,
  applyResize, applyMove, normaliseBox, clampBox, HANDLE_CURSORS,
} from '../utils/boxUtils';

/**
 * useBoxEditor — manages all mouse/keyboard interactions for the OCR canvas.
 *
 * Returns:
 *   handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
 *   handleKeyDown  — attach to the <canvas> element
 *   drawingBox     — { box, type } while draw-mode drag is in progress (or null)
 *   cursor         — CSS cursor string for the canvas element
 */
export function useBoxEditor({
  canvasRef,
  sessionId,
  participant,       // 'modelA' | 'modelB'
  annotations,       // current annotation array
  zoomLevel,
  imageWidth,
  imageHeight,
  onBoxDrawn,        // optional callback(annotation) fired after a new box is committed
}) {
  const dispatch = useDispatch();
  const { canvasMode, drawType, selectedAnnotationId } = useSelector(s => s.ocrChat);

  // ── Interaction state (not Redux — ephemeral during drag) ──────────────────
  const [drawingBox, setDrawingBox] = useState(null); // { anchor, current } while drawing
  const [cursor, setCursor] = useState('default');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, annotationId } | null

  const interactionRef = useRef({
    mode: 'idle', // 'idle' | 'drawing' | 'dragging' | 'resizing'
    anchorPt: null,
    anchorBox: null,
    handle: null,
    lastPt: null,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getCoords = useCallback((e) => {
    return toNaturalCoords(e, canvasRef, zoomLevel);
  }, [canvasRef, zoomLevel]);

  const findAnnotationAt = useCallback((pt) => {
    // Reverse order so topmost (last drawn) is hit first
    return [...annotations].reverse().find(ann => pointInBox(pt, ann.box)) || null;
  }, [annotations]);

  const findSelectedAnnotation = useCallback(() => {
    return annotations.find(a => a.id === selectedAnnotationId) || null;
  }, [annotations, selectedAnnotationId]);

  // ── Mouse Down ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const pt = getCoords(e);
    const inter = interactionRef.current;

    if (canvasMode === 'draw') {
      inter.mode = 'drawing';
      inter.anchorPt = pt;
      setDrawingBox({ anchor: pt, current: pt });
      return;
    }

    // SELECT mode: check handles first, then box interior
    const selectedAnn = findSelectedAnnotation();
    if (selectedAnn) {
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
      inter.mode = 'dragging';
      inter.anchorBox = [...hitAnn.box];
      inter.lastPt = pt;
    } else {
      dispatch(setSelectedAnnotationId(null));
      dispatch(setActiveAnnotationId(null));
      inter.mode = 'idle';
    }
  }, [canvasMode, getCoords, findSelectedAnnotation, findAnnotationAt, dispatch]);

  // ── Mouse Move ─────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const pt = getCoords(e);
    const inter = interactionRef.current;

    if (inter.mode === 'drawing') {
      setDrawingBox({ anchor: inter.anchorPt, current: pt });
      setCursor('crosshair');
      return;
    }

    if (inter.mode === 'resizing') {
      const delta = { dx: pt.x - inter.lastPt.x, dy: pt.y - inter.lastPt.y };
      inter.lastPt = pt;
      const newBox = clampBox(
        applyResize(inter.anchorBox, inter.handle, delta),
        imageWidth, imageHeight
      );
      inter.anchorBox = newBox;
      dispatch(updateAnnotationBox({ sessionId, participant, annotationId: selectedAnnotationId, box: newBox }));
      setCursor(HANDLE_CURSORS[inter.handle]);
      return;
    }

    if (inter.mode === 'dragging') {
      const delta = { dx: pt.x - inter.lastPt.x, dy: pt.y - inter.lastPt.y };
      inter.lastPt = pt;
      const [x1, y1, x2, y2] = inter.anchorBox;
      const newBox = clampBox(
        [x1 + delta.dx, y1 + delta.dy, x2 + delta.dx, y2 + delta.dy],
        imageWidth, imageHeight
      );
      inter.anchorBox = newBox;
      dispatch(updateAnnotationBox({ sessionId, participant, annotationId: selectedAnnotationId, box: newBox }));
      setCursor('move');
      return;
    }

    // Idle: update hover cursor
    if (canvasMode === 'draw') {
      setCursor('crosshair');
      return;
    }

    const selectedAnn = findSelectedAnnotation();
    if (selectedAnn) {
      const handle = getHandleAtPoint(selectedAnn.box, pt);
      if (handle) {
        setCursor(HANDLE_CURSORS[handle]);
        return;
      }
    }

    const hitAnn = findAnnotationAt(pt);
    if (hitAnn) {
      dispatch(setActiveAnnotationId(hitAnn.id));
      setCursor('move');
    } else {
      dispatch(setActiveAnnotationId(null));
      setCursor('default');
    }
  }, [
    getCoords, canvasMode, findSelectedAnnotation, findAnnotationAt,
    selectedAnnotationId, sessionId, participant, imageWidth, imageHeight, dispatch,
  ]);

  // ── Mouse Up ───────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e) => {
    const pt = getCoords(e);
    const inter = interactionRef.current;

    if (inter.mode === 'drawing' && drawingBox) {
      const raw = normaliseBox([inter.anchorPt.x, inter.anchorPt.y, pt.x, pt.y]);
      const box = clampBox(raw, imageWidth, imageHeight);
      const w = box[2] - box[0];
      const h = box[3] - box[1];

      if (w > 5 && h > 5) {
        const newAnnotation = {
          id: `r${uuidv4().slice(0, 8)}`,
          box,
          text: '',
          type: drawType || 'paragraph',
          labels: [drawType || 'paragraph'],
          confidence: 1.0,
          page: 1,
        };
        dispatch(addAnnotation({ sessionId, participant, annotation: newAnnotation }));
        dispatch(setSelectedAnnotationId(newAnnotation.id));
        dispatch(setActiveAnnotationId(newAnnotation.id));
        // Switch back to select mode after drawing one box
        dispatch(setCanvasMode('select'));
        onBoxDrawn?.(newAnnotation);
      }

      setDrawingBox(null);
    }

    inter.mode = 'idle';
    inter.anchorPt = null;
    inter.anchorBox = null;
    inter.handle = null;
    inter.lastPt = null;
  }, [getCoords, drawingBox, imageWidth, imageHeight, sessionId, participant, onBoxDrawn, dispatch]);

  const handleMouseLeave = useCallback(() => {
    const inter = interactionRef.current;
    if (inter.mode === 'drawing') {
      setDrawingBox(null);
      inter.mode = 'idle';
    }
    dispatch(setActiveAnnotationId(null));
  }, [dispatch]);

  // ── Keyboard Shortcuts (global — works without clicking the canvas first) ──
  const handleKeyDown = useCallback((e) => {
    // Ignore events from text inputs / textareas so typing isn't intercepted
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
    } else if (mod && e.key === 'd') {
      e.preventDefault();
      dispatch(duplicateAnnotation({ sessionId, participant, annotationId: selectedAnnotationId }));
    } else if (e.key === 'Escape') {
      dispatch(setSelectedAnnotationId(null));
    }
  }, [selectedAnnotationId, sessionId, participant, dispatch]);

  // Attach as a global listener so shortcuts fire without canvas focus
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Context Menu ───────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const pt = getCoords(e);
    const hitAnn = findAnnotationAt(pt);
    if (hitAnn) {
      dispatch(setSelectedAnnotationId(hitAnn.id));
      dispatch(setActiveAnnotationId(hitAnn.id));
      // Clamp to viewport so menu never goes off-screen
      const MENU_W = 180, MENU_H = 190;
      const x = Math.min(e.clientX, window.innerWidth  - MENU_W - 8);
      const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
      setContextMenu({ x, y, annotationId: hitAnn.id });
    } else {
      setContextMenu(null);
    }
  }, [getCoords, findAnnotationAt, dispatch]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Close context menu when clicking anywhere outside it
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    // Use setTimeout so this listener doesn't fire on the same right-click that opened the menu
    const t = setTimeout(() => window.addEventListener('click', handler), 0);
    return () => { clearTimeout(t); window.removeEventListener('click', handler); };
  }, [contextMenu]);

  const contextMenuActions = {
    delete: useCallback((annotationId) => {
      dispatch(deleteAnnotation({ sessionId, participant, annotationId }));
      setContextMenu(null);
    }, [sessionId, participant, dispatch]),
    duplicate: useCallback((annotationId) => {
      dispatch(duplicateAnnotation({ sessionId, participant, annotationId }));
      setContextMenu(null);
    }, [sessionId, participant, dispatch]),
    setType: useCallback((annotationId, type) => {
      dispatch(updateAnnotationType({ sessionId, participant, annotationId, type }));
      setContextMenu(null);
    }, [sessionId, participant, dispatch]),
  };

  // Focus canvas so keydown events are received
  useEffect(() => {
    const el = canvasRef.current;
    if (el) el.setAttribute('tabindex', '0');
  }, [canvasRef]);

  // Compute live drawing box from anchor + current point
  const liveDrawingBox = drawingBox
    ? normaliseBox([drawingBox.anchor.x, drawingBox.anchor.y, drawingBox.current.x, drawingBox.current.y])
    : null;

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleKeyDown,
    handleContextMenu,
    closeContextMenu,
    contextMenu,
    contextMenuActions,
    drawingBox: liveDrawingBox,
    cursor,
  };
}
