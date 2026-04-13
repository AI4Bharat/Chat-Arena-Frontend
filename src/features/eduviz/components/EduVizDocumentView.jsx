import { useRef, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { EduVizCanvas } from './EduVizCanvas';
import { EduVizAssessmentPanel } from './EduVizAssessmentPanel';
import { EduVizErrorToolbar } from './EduVizErrorToolbar';
import { EduVizMetadataBar } from './EduVizMetadataBar';
import { setSelectedAnnotationId, setZoomLevel, addAnnotation as eduvizAddAnnotation } from '../store/eduvizSlice';
import {
  setAnnotationMessageId as setOcrAnnotationMessageId,
  setSelectedAnnotationId as setOcrSelectedAnnotationId,
  setActiveAnnotationId as setOcrActiveAnnotationId,
} from '../../ocr/store/chatSlice';
import { syncEduvizSession } from '../store/eduvizSlice';

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
    zoomLevel, referenceImageUrl, studentImageUrl,
    submitStatus, metadata, suggestedImprovement, isSidebarOpen,
  } = useSelector(s => s.eduviz);

  const prevZoomValRef = useRef(zoomLevel);

  const isStreaming = processingStatus === 'streaming';
  const [leftPct, setLeftPct] = useState(30);
  const [rightPct, setRightPct] = useState(28);
  const containerRef = useRef(null);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const refImgRef = useRef(null);
  const refContainerRef = useRef(null);
  const [refZoom, setRefZoom] = useState(1.0);

  // Responsive states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState('submission'); // 'reference' | 'submission' | 'assessment'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Auto-select first annotation ONLY on initial session load
  const hasInitiallySelected = useRef(false);
  useEffect(() => {
    if (annList.length > 0 && !ocrSelectedId && !hasInitiallySelected.current) {
      dispatch(setSelectedAnnotationId(annList[0].id));
      dispatch(setOcrSelectedAnnotationId(annList[0].id));
      hasInitiallySelected.current = true;
    }
  }, [annList.length, ocrSelectedId, dispatch]);

  // Fit reference image to container
  const fitRefToContainer = useCallback(() => {
    const img = refImgRef.current;
    const container = refContainerRef.current;
    if (!img || !container || !img.naturalWidth) return;
    const pad = 32;
    const fitZoom = Math.min(
      (container.clientWidth - pad) / img.naturalWidth,
      (container.clientHeight - 42 - pad) / img.naturalHeight,
      1.0
    );
    isAutoRefFitRef.current = true;
    setRefZoom(Math.max(0.1, Math.round(fitZoom * 100) / 100));
  }, []);

  const onRefImageLoad = useCallback(() => {
    fitRefToContainer();
  }, [fitRefToContainer]);

  // Handle reference container resizing
  const isAutoRefFitRef = useRef(true);
  const lastRefContainerSize = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const container = refContainerRef.current;
    if (!container) return;

    let resizeTimer = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (Math.abs(width - lastRefContainerSize.current.w) < 2 && Math.abs(height - lastRefContainerSize.current.h) < 2) {
        return;
      }

      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        const img = refImgRef.current;
        if (img && img.naturalWidth > 0 && isAutoRefFitRef.current) {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const pad = 32;
          const fitZoom = Math.min((width - pad) / w, (height - 42 - pad) / h, 1.0);
          const currentFitZoom = Math.max(0.1, Math.round(fitZoom * 100) / 100);

          setRefZoom(currentFitZoom);
          lastRefContainerSize.current = { w: width, h: height };
        }
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
    };
  }, [isMobile, activeTab]);

  // Ctrl+scroll zoom for reference pane
  useEffect(() => {
    const container = refContainerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      isAutoRefFitRef.current = false;
      setRefZoom(z => Math.min(3.0, Math.max(0.1, z * factor)));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [isMobile, activeTab]);

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

  // Auto-save EVERYTHING (annotations, metadata, scores) to session metadata
  const lastSyncStringRef = useRef(null);
  useEffect(() => {
    if (!sessionId) return;

    const timer = setTimeout(() => {
      // Create a stable string representation of all manual work
      const syncDataBlob = {
        annList,
        metadata,
        suggestedImprovement
      };
      const currentString = JSON.stringify(syncDataBlob);

      if (currentString !== lastSyncStringRef.current) {
        dispatch(syncEduvizSession({ sessionId }));
        lastSyncStringRef.current = currentString;
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [annList, metadata, suggestedImprovement, sessionId, dispatch]);

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
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 flex p-1 gap-1">
          {[
            { id: 'reference', label: 'Reference' },
            { id: 'submission', label: 'Submission' },
            { id: 'assessment', label: 'Assessment' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Three panes */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">

        {(!isMobile || activeTab === 'reference') && (
          <div
            className={`relative overflow-hidden flex-shrink-0 border-r border-gray-200 bg-white ${isMobile ? 'w-full' : ''}`}
            style={isMobile ? {} : { width: `${leftPct}%` }}
          >
            <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-gray-100 flex items-center">
              <span className="text-[11px] sm:text-[11.5px] font-bold text-gray-700 uppercase tracking-widest px-1 relative after:absolute after:-bottom-2.5 after:left-1 after:w-[80%] after:h-[2px] after:bg-orange-400 after:rounded-t-full">
                Reference Material
              </span>
            </div>
            
            <div
              ref={refContainerRef}
              className="absolute inset-0 pt-[42px] overflow-auto bg-gray-100 select-none pb-4"
            >
              {referenceImageUrl && (
                <div
                  style={{
                    position: 'relative',
                    width: refImgRef.current?.naturalWidth ? refImgRef.current.naturalWidth * refZoom : '100%',
                    height: refImgRef.current?.naturalHeight ? refImgRef.current.naturalHeight * refZoom : '100%',
                    margin: '16px auto',
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${refZoom})`,
                      transformOrigin: 'top left',
                      lineHeight: 0,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: refImgRef.current?.naturalWidth || 0,
                      height: refImgRef.current?.naturalHeight || 0,
                    }}
                  >
                    <img
                      ref={refImgRef}
                      src={referenceImageUrl}
                      alt="Reference Material"
                      onLoad={onRefImageLoad}
                      draggable={false}
                      style={{
                        display: 'block',
                        userSelect: 'none',
                        maxWidth: 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {(!referenceImageUrl) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] uppercase tracking-widest">
                No Reference Loaded
              </div>
            )}
          </div>
        )}

        {/* Left divider */}
        {!isMobile && (
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
        )}

        {(!isMobile || activeTab === 'submission') && (
          <div
            className="relative overflow-hidden flex-1 flex flex-col bg-slate-50/30"
            style={isMobile ? {} : { minWidth: `${MIN_CENTER_PCT}%` }}
          >
            {/* Header */}
            <div className="flex-shrink-0 z-20 px-4 py-2.5 bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-gray-100 flex items-center">
              <span className="text-[11px] sm:text-[11.5px] font-bold text-gray-700 uppercase tracking-widest px-1 relative after:absolute after:-bottom-2.5 after:left-1 after:w-[80%] after:h-[2px] after:bg-orange-400 after:rounded-t-full">
                Submission Output
              </span>
              {submitStatus === 'saving' && (
                <span className="ml-3 text-[10px] text-orange-500 animate-pulse uppercase tracking-wider font-bold">Saving...</span>
              )}
              {submitStatus === 'saved' && (
                <span className="ml-3 text-[10px] text-green-500 uppercase tracking-wider font-bold">All Changes Saved</span>
              )}
              {submitStatus === 'error' && (
                <span className="ml-3 text-[10px] text-red-500 uppercase tracking-wider font-bold">Save Error</span>
              )}
              {isStreaming && (
                <span className="inline-flex items-center gap-[3px] ml-2">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              )}
            </div>

            {/* Main Working Area */}
            <div className="relative flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Canvas Container */}
              <div className="relative flex-1 h-full bg-slate-50">
                <div className="absolute inset-0">
                  <EduVizCanvas
                    imageUrl={currentPage.url}
                    imageWidth={currentPage.width}
                    imageHeight={currentPage.height}
                    annotations={annList}
                    sessionId={pageKey}
                    participant={participant}
                  />
                </div>
                {(!currentPage.url) && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50">
                    No Submission Loaded
                  </div>
                )}
              </div>

              {/* toolkit position: mobile bottom, desktop right side */}
              <div className={`${isMobile
                ? 'absolute bottom-4 left-4 right-4 z-30 flex justify-center'
                : 'flex-shrink-0 w-[95px] h-full bg-white/95 backdrop-blur-md z-20 flex flex-col pt-4 pb-4 border-l border-gray-200 shadow-[-2px_0_15px_rgba(0,0,0,0.04)] items-center overflow-y-auto [&::-webkit-scrollbar]:w-0'
                }`}>
                <EduVizErrorToolbar vertical={!isMobile} />
              </div>
            </div>
          </div>
        )}

        {/* Right divider */}
        {!isMobile && isSidebarOpen && (
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
        )}

        {((!isMobile && isSidebarOpen) || (isMobile && activeTab === 'assessment')) && (
          <div
            className={`flex-shrink-0 flex flex-col overflow-hidden bg-white ${isMobile ? 'w-full' : 'border-l border-gray-200'}`}
            style={isMobile ? {} : { width: `${rightPct}%` }}
          >
            <div className="flex-1 overflow-hidden relative">
              <EduVizAssessmentPanel />
            </div>
          </div>
        )}
      </div>

      {/* Metadata bar below */}
      <EduVizMetadataBar />
    </div>
  );
}
