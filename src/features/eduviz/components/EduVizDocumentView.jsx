import { useRef, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { OcrCanvas } from '../../ocr/components/OcrCanvas';
import { EduVizAssessmentPanel } from './EduVizAssessmentPanel';
import { EduVizErrorToolbar } from './EduVizErrorToolbar';
import { EduVizMetadataBar } from './EduVizMetadataBar';
import { setSelectedAnnotationId, setZoomLevel, addAnnotation as eduvizAddAnnotation } from '../store/eduvizSlice';
import {
  setAnnotationMessageId as setOcrAnnotationMessageId,
  setSelectedAnnotationId as setOcrSelectedAnnotationId,
  setActiveAnnotationId as setOcrActiveAnnotationId,
} from '../../ocr/store/chatSlice';

const MIN_LEFT_PCT = 20;
const MAX_LEFT_PCT = 45;
const MIN_CENTER_PCT = 25;

/**
 * EduVizDocumentView — three-pane layout:
 * Left:   REFERENCE MATERIAL (read-only image)
 * Center: SUBMISSION OUTPUT (image + annotation canvas)
 * Right:  ASSESSMENT PANEL (rubrics, textareas, submit)
 * Bottom: Error toolbar + Metadata bar
 */
export function EduVizDocumentView({ sessionId }) {
  const dispatch = useDispatch();
  const participant = 'modelA';

  const {
    pages, currentPageIndex, annotations, annotationMessageIds,
    processingStatus, annotationHistory, annotationFuture, activeSession,
  } = useSelector(s => s.eduviz);

  const isStreaming = processingStatus === 'streaming';
  const [leftPct, setLeftPct] = useState(30);
  const [rightPct, setRightPct] = useState(28);
  const containerRef = useRef(null);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const refImgRef = useRef(null);
  const refContainerRef = useRef(null);
  const [refZoom, setRefZoom] = useState(1.0);

  const currentPage = pages[currentPageIndex];
  const pageKey = `${sessionId}_${currentPageIndex}`;
  const sessionAnnotations = annotations[pageKey] || annotations[sessionId] || { modelA: [] };
  const annList = sessionAnnotations[participant] || [];

  // Read ocrChat annotations to detect new boxes drawn via useBoxEditor
  const ocrAnnotations = useSelector(s => s.ocrChat.annotations[pageKey]?.modelA || []);
  const prevOcrCountRef = useRef(0);
  const syncedToOcrRef = useRef(new Set());

  // Sync eduviz annotations → ocrChat store (so OcrCanvas can render them)
  useEffect(() => {
    annList.forEach(ann => {
      if (!syncedToOcrRef.current.has(ann.id)) {
        dispatch({ type: 'ocrChat/streamAnnotation', payload: { sessionId: pageKey, participant, annotation: ann } });
        syncedToOcrRef.current.add(ann.id);
      }
    });
  }, [annList, pageKey, participant, dispatch]);

  // Sync: when OcrCanvas adds a new annotation via useBoxEditor (which writes to ocrChat),
  // mirror it into eduviz store
  useEffect(() => {
    if (ocrAnnotations.length > prevOcrCountRef.current && prevOcrCountRef.current > 0) {
      // New annotations were added by useBoxEditor to ocrChat
      const newOnes = ocrAnnotations.slice(prevOcrCountRef.current);
      newOnes.forEach(ann => {
        // Check if it already exists in eduviz
        const exists = annList.find(a => a.id === ann.id);
        if (!exists) {
          dispatch(eduvizAddAnnotation({ sessionId: pageKey, participant, annotation: ann }));
        }
      });
    }
    prevOcrCountRef.current = ocrAnnotations.length;
  }, [ocrAnnotations.length]);

  // Sync: keep eduviz.selectedAnnotationId matched to ocrChat.selectedAnnotationId (canvas clicks)
  const ocrSelectedId = useSelector(s => s.ocrChat.selectedAnnotationId);
  const eduvizSelectedId = useSelector(s => s.eduviz.selectedAnnotationId);
  useEffect(() => {
    if (ocrSelectedId && ocrSelectedId !== eduvizSelectedId) {
      dispatch(setSelectedAnnotationId(ocrSelectedId));
    }
  }, [ocrSelectedId, eduvizSelectedId, dispatch]);

  // Auto-select first annotation when annotations load
  useEffect(() => {
    if (annList.length > 0 && !ocrSelectedId) {
      dispatch(setSelectedAnnotationId(annList[0].id));
      dispatch(setOcrSelectedAnnotationId(annList[0].id));
    }
  }, [annList.length > 0, ocrSelectedId, dispatch]);

  // Fit reference image to container
  const onRefImageLoad = useCallback(() => {
    const img = refImgRef.current;
    const container = refContainerRef.current;
    if (!img || !container) return;
    const pad = 32;
    const fitZoom = Math.min(
      (container.clientWidth - pad) / img.naturalWidth,
      (container.clientHeight - pad) / img.naturalHeight,
      1.0
    );
    setRefZoom(Math.max(0.1, Math.round(fitZoom * 100) / 100));
  }, []);

  // Ctrl+scroll zoom for reference pane
  useEffect(() => {
    const container = refContainerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      setRefZoom(z => Math.min(3.0, Math.max(0.1, z * factor)));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Left divider drag
  const handleLeftDividerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    const onMouseMove = (e) => {
      if (!isDraggingLeft.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)));
    };
    const onMouseUp = () => {
      isDraggingLeft.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Right divider drag
  const handleRightDividerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRight.current = true;
    const onMouseMove = (e) => {
      if (!isDraggingRight.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pctFromRight = ((rect.right - e.clientX) / rect.width) * 100;
      setRightPct(Math.min(40, Math.max(20, pctFromRight)));
    };
    const onMouseUp = () => {
      isDraggingRight.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  if (!currentPage) return null;

  const centerPct = Math.max(MIN_CENTER_PCT, 100 - leftPct - rightPct);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Three panes */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* LEFT: Reference Material */}
        <div
          className="relative overflow-hidden flex-shrink-0 border-r border-gray-200"
          style={{ width: `${leftPct}%` }}
        >
          <div className="absolute top-0 left-0 right-0 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Reference Material</span>
          </div>
          <div
            ref={refContainerRef}
            className="absolute inset-0 pt-8 overflow-auto bg-gray-100 select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <div
              style={{
                position: 'relative',
                margin: '16px auto',
                transformOrigin: 'top left',
              }}
            >
              <img
                ref={refImgRef}
                src={currentPage.url}
                alt="Reference Material"
                onLoad={onRefImageLoad}
                draggable={false}
                style={{
                  display: 'block',
                  userSelect: 'none',
                  maxWidth: 'none',
                  transform: `scale(${refZoom})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
          {(!currentPage.url) && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm uppercase tracking-wide">
              No Reference Loaded
            </div>
          )}
        </div>

        {/* Left divider */}
        <div
          className="group relative flex-shrink-0 flex items-center justify-center cursor-col-resize select-none"
          style={{ width: 8 }}
          onMouseDown={handleLeftDividerDown}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 group-hover:bg-orange-400 transition-colors duration-150" />
          <div className="relative z-10 flex flex-col gap-[3px] px-0.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-orange-300 transition-all duration-150">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-400 group-hover:bg-orange-500 transition-colors duration-150" />
            ))}
          </div>
        </div>

        {/* CENTER: Submission Output */}
        <div
          className="relative overflow-hidden flex-1"
          style={{ minWidth: `${MIN_CENTER_PCT}%` }}
        >
          <div className="absolute top-0 left-0 right-0 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Submission Output</span>
            {isStreaming && (
              <span className="inline-flex items-center gap-[3px] ml-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            )}
          </div>
          <div className="absolute inset-0 pt-8">
            <OcrCanvas
              imageUrl={currentPage.url}
              imageWidth={currentPage.width}
              imageHeight={currentPage.height}
              annotations={annList}
              sessionId={pageKey}
              participant={participant}
            />
          </div>
          {/* Floating error toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <EduVizErrorToolbar />
          </div>
          {(!currentPage.url) && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm uppercase tracking-wide">
              No Submission Loaded
            </div>
          )}
        </div>

        {/* Right divider */}
        <div
          className="group relative flex-shrink-0 flex items-center justify-center cursor-col-resize select-none"
          style={{ width: 8 }}
          onMouseDown={handleRightDividerDown}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 group-hover:bg-orange-400 transition-colors duration-150" />
          <div className="relative z-10 flex flex-col gap-[3px] px-0.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-orange-300 transition-all duration-150">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-400 group-hover:bg-orange-500 transition-colors duration-150" />
            ))}
          </div>
        </div>

        {/* RIGHT: Assessment Panel */}
        <div
          className="flex-shrink-0 overflow-hidden border-l border-gray-200"
          style={{ width: `${rightPct}%` }}
        >
          <EduVizAssessmentPanel />
        </div>
      </div>

      {/* Metadata bar below */}
      <EduVizMetadataBar />
    </div>
  );
}
