import { useRef, useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Wand2, FileText, Undo2, Redo2, Info, Download, ChevronDown } from 'lucide-react';
import { OcrCanvas } from './OcrCanvas';
import { OcrAnnotationPanel } from './OcrAnnotationPanel';
import { OcrToolbar } from './OcrToolbar';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { updateAnnotationText, undoAnnotation, redoAnnotation } from '../store/chatSlice';
import { exportJson, exportHtml, exportMarkdown, exportDocx } from '../utils/exportUtils';
import { cn } from '../../../shared/utils';

const MIN_LEFT_PCT = 30;
const DESKTOP_MIN_ANNOTATION_PCT = 30;
const TABLET_MIN_ANNOTATION_PCT = 40;
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * OcrDocumentView — split-pane view with a draggable divider.
 * Left : image canvas + floating toolbar  (min 30%).
 * Right: scrollable annotation cards      (min 30% desktop, 40% tablet).
 */
export function OcrDocumentView({ sessionId, participant = 'modelA' }) {
  const dispatch = useDispatch();
  const { pages, currentPageIndex, annotations, editedAnnotations, annotationMessageIds, processingStatus, annotationHistory, annotationFuture, activeSession } = useSelector(s => s.ocrChat);
  const isStreaming = processingStatus === 'streaming';
  const [leftPct, setLeftPct] = useState(50);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'stacked'
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [autoExtract, setAutoExtract] = useState(true);
  const [showPanelInfo, setShowPanelInfo] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [extractingIds, setExtractingIds] = useState(new Set());
  const [canvasWidth, setCanvasWidth] = useState(null); // tracks canvas panel width for toolbar compact mode
  const [panelWidth, setPanelWidth] = useState(null); // tracks right panel width for header compact mode
  const containerRef = useRef(null);
  const canvasPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const isDragging = useRef(false);
  const infoButtonRef = useRef(null);
  const exportBtnRef = useRef(null);

  useEffect(() => {
    if (!showPanelInfo) return;
    const handler = e => { if (!infoButtonRef.current?.contains(e.target)) setShowPanelInfo(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showPanelInfo]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = e => { if (!exportBtnRef.current?.contains(e.target)) setShowExportMenu(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  useEffect(() => {
    const el = canvasPanelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = rightPanelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setPanelWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measuringFullRef = useRef(null);
  const [fullTbWidth, setFullTbWidth] = useState(550);

  useEffect(() => {
    const el = measuringFullRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setFullTbWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentPage = pages[currentPageIndex];
  // Support both new page-keyed format and legacy sessionId key (for sessions loaded from DB pre-migration)
  const pageKey = `${sessionId}_${currentPageIndex}`;
  const sessionAnnotations = annotations?.[pageKey] || annotations?.[sessionId] || { modelA: [], modelB: [] };
  const annList = sessionAnnotations[participant] || [];
  const messageId = annotationMessageIds?.[pageKey]?.[participant] ?? annotationMessageIds?.[sessionId]?.[participant];

  const filename = activeSession?.metadata?.source_filename
    ? activeSession.metadata.source_filename.replace(/\.[^.]+$/, '')
    : activeSession?.title || 'ocr-export';

  const handleExport = useCallback(async (format) => {
    setShowExportMenu(false);
    if (format === 'json') exportJson(sessionId, pages, annotations, editedAnnotations, participant, activeSession, filename);
    else if (format === 'html') exportHtml(sessionId, pages, annotations, editedAnnotations, participant, filename);
    else if (format === 'md')   exportMarkdown(sessionId, pages, annotations, editedAnnotations, participant, filename);
    else if (format === 'docx') await exportDocx(sessionId, pages, annotations, editedAnnotations, participant, filename);
  }, [sessionId, pages, annotations, editedAnnotations, participant, filename]);

  const handleSave = useCallback(async () => {
    if (!messageId || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await apiClient.patch(endpoints.messages.saveAnnotations(messageId), {
        ocr_result: annList,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [messageId, annList, saveStatus]);

  const extractRegionText = useCallback(async (annotationId, box) => {
    if (!messageId) return;
    setExtractingIds(prev => new Set(prev).add(annotationId));
    try {
      const res = await apiClient.post(endpoints.messages.extractRegionText(messageId), { box });
      const text = res.data?.text ?? '';
      dispatch(updateAnnotationText({ sessionId: pageKey, participant, annotationId, text }));
    } catch (err) {
      console.error('Region text extraction failed:', err);
    } finally {
      setExtractingIds(prev => { const next = new Set(prev); next.delete(annotationId); return next; });
    }
  }, [messageId, pageKey, participant, dispatch]);

  // Called by OcrCanvas after a new box is drawn (auto-extract path)
  const handleBoxDrawn = useCallback((annotation) => {
    if (autoExtract) extractRegionText(annotation.id, annotation.box);
  }, [autoExtract, extractRegionText]);

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const isTablet = viewportWidth >= MOBILE_BREAKPOINT && viewportWidth < TABLET_BREAKPOINT;
  const minRightPct = isTablet ? TABLET_MIN_ANNOTATION_PCT : DESKTOP_MIN_ANNOTATION_PCT;
  const activeViewMode = isMobile ? 'stacked' : viewMode;
  const toolbarCompact = canvasWidth !== null && canvasWidth < fullTbWidth + 24;
  const isCompact = panelWidth !== null && panelWidth < 340;

  useEffect(() => {
    setLeftPct(prev => Math.min(100 - minRightPct, Math.max(MIN_LEFT_PCT, prev)));
  }, [minRightPct]);

  const handleDividerPointerDown = useCallback((e) => {
    // Only handle main button (mouse left click, or touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    isDragging.current = true;

    const onPointerMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect   = containerRef.current.getBoundingClientRect();
      const rawPct = activeViewMode === 'split'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;
        
      const clampedPct = Math.min(100 - minRightPct, Math.max(MIN_LEFT_PCT, rawPct));
      
      setLeftPct(clampedPct);

      // Active Width Calculation: Update these states INSTANTLY inside the drag loop 
      // rather than waiting for the asynchronous ResizeObserver callbacks.
      if (activeViewMode === 'split') {
        setCanvasWidth((rect.width * clampedPct) / 100);
        setPanelWidth((rect.width * (100 - clampedPct)) / 100);
      } else {
        setCanvasWidth(rect.width);
        setPanelWidth(rect.width);
      }
    };

    const onPointerUp = (e) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDragging.current = false;

      // Final measurement sync after drag ends to ensure precision
      if (canvasPanelRef.current) setCanvasWidth(canvasPanelRef.current.getBoundingClientRect().width);
      if (rightPanelRef.current) setPanelWidth(rightPanelRef.current.getBoundingClientRect().width);

      e.currentTarget.removeEventListener('pointermove', onPointerMove);
      e.currentTarget.removeEventListener('pointerup', onPointerUp);
    };

    e.currentTarget.addEventListener('pointermove', onPointerMove);
    e.currentTarget.addEventListener('pointerup', onPointerUp);
  }, [activeViewMode, minRightPct]);

  if (!currentPage) return null;

  const toolbarLayout = {
    viewMode: activeViewMode,
    hideViewToggle: isMobile,
    compact: toolbarCompact
  };

  const toolbarActions = {
    onViewModeChange: setViewMode
  };

  return (
    <div ref={containerRef} className={cn(
      "flex flex-1 overflow-hidden",
      activeViewMode === 'stacked' ? "flex-col" : "flex-row"
    )}>
      {/* Left/Top: Canvas + floating toolbar */}
      <div
        ref={canvasPanelRef}
        className="relative overflow-hidden flex-shrink-0"
        style={{ 
          [activeViewMode === 'split' ? 'width' : 'height']: `${leftPct}%`, 
          [activeViewMode === 'split' ? 'minWidth' : 'minHeight']: `${MIN_LEFT_PCT}%` 
        }}
      >
        <OcrCanvas
          imageUrl={currentPage.url}
          imageWidth={currentPage.width}
          imageHeight={currentPage.height}
          annotations={annList}
          sessionId={pageKey}
          participant={participant}
          onBoxDrawn={handleBoxDrawn}
        />

        {/* Floating toolbar — ALWAYS centered, max-w constrained.
             Full (≥ measured)  : text labels
             Compact (< measured): label-less mode pill
             Scroll (< measured) : natively wraps overflowing flex content inside the pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[calc(100%-16px)] flex justify-center">
          <OcrToolbar 
            layout={toolbarLayout} 
            actions={toolbarActions}
          />
        </div>

        {/* Invisible Measurer (calculates completely accurate dynamic thresholds without causing infinite ResizeObserver loops) */}
        <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
          <div ref={measuringFullRef} className="w-max">
            <OcrToolbar 
              layout={{ ...toolbarLayout, compact: false }} 
              actions={toolbarActions}
            />
          </div>
        </div>
      </div>

      {/* Draggable divider */}
      <div
        className={cn(
          "group relative flex-shrink-0 flex items-center justify-center select-none",
          activeViewMode === 'stacked' ? "cursor-row-resize" : "cursor-col-resize"
        )}
        style={{ [activeViewMode === 'stacked' ? 'height' : 'width']: 8, touchAction: 'none' }}
        onPointerDown={handleDividerPointerDown}
      >
        {/* Base line — 2px centered, thicker & orange so it reads as a handle not a scrollbar */}
        <div className={cn(
          "absolute bg-gray-300 group-hover:bg-orange-400 transition-colors duration-150",
          activeViewMode === 'stacked' ? "inset-x-0 top-1/2 -translate-y-1/2 h-0.5" : "inset-y-0 left-1/2 -translate-x-1/2 w-0.5"
        )} />
        {/* Grip pill — always visible, reinforces "draggable" intent */}
        <div className={cn(
          "relative z-10 flex gap-[3px] rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-orange-300 group-hover:shadow-orange-100 transition-all duration-150",
          activeViewMode === 'stacked' ? "flex-row px-1.5 py-0.5" : "flex-col px-0.5 py-1.5"
        )}>
          {[0, 1, 2].map(i => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-400 group-hover:bg-orange-500 transition-colors duration-150" />
          ))}
        </div>
      </div>


      {/* Right/Bottom: Annotation Panel — flex-1 takes remaining space after left/top panel + divider */}
      <div
        ref={rightPanelRef}
        className="flex-1 flex flex-col bg-white overflow-hidden min-w-0 min-h-0"
        style={{ [activeViewMode === 'split' ? 'minWidth' : 'minHeight']: `${minRightPct}%` }}
      >
        <div className="px-3 py-2 border-b border-gray-100 flex flex-shrink-0 flex-wrap justify-between items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annotations</span>
            <button
              ref={infoButtonRef}
              onClick={() => setShowPanelInfo(v => !v)}
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
                showPanelInfo ? "bg-orange-50 text-orange-500" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <Info size={13}/>
            </button>
            {showPanelInfo && infoButtonRef.current && ReactDOM.createPortal((() => {
              const rect = infoButtonRef.current.getBoundingClientRect();
              return (
                <div style={{ position: 'fixed', top: rect.bottom + 6, left: rect.left, zIndex: 10001, width: 256 }}
                  className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-xs"
                  onMouseDown={e => e.stopPropagation()}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Card actions</p>
                  <div className="space-y-1.5 mb-3">
                    {[
                      { key: 'grip',  label: 'Drag grip',                               desc: 'Reorder cards' },
                      { key: 'type',  label: 'Type badge',                              desc: 'Change region type' },
                      { key: 'wand',  label: <span className="inline-flex items-center gap-0.5"><Wand2 size={10}/>Wand</span>, desc: 'Extract text via AI' },
                      { key: 'copy',  label: 'Copy',                                    desc: 'Copy text (tables as TSV)' },
                      { key: 'trash', label: 'Trash',                                   desc: 'Delete region' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex justify-between gap-3">
                        <span className="text-gray-500 shrink-0">{desc}</span>
                        <span className="text-gray-400 text-right flex items-center gap-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Auto button</p>
                  <p className="text-gray-500 mb-3 leading-relaxed">When <span className="inline-flex items-center gap-0.5 text-orange-500 font-medium"><Wand2 size={10}/>Auto</span> is on, drawing a new box automatically sends the region to the AI model to extract its text.</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Shortcuts</p>
                  <div className="space-y-1.5">
                    {[
                      ['⌘Z / Ctrl+Z',   'Undo'],
                      ['⌘Y / Ctrl+Y',   'Redo'],
                      ['Del / ⌫',       'Delete selected box'],
                      ['⌘D / Ctrl+D',   'Duplicate selected box'],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex justify-between gap-3">
                        <span className="text-gray-500 shrink-0">{desc}</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px] whitespace-nowrap">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })(), document.body)}
            <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
              {annList.length} region{annList.length !== 1 ? 's' : ''}
            </span>
            {isStreaming && (
              <span className="inline-flex items-center gap-[3px]">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-orange-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            )}
            {pages.length > 1 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px] tabular-nums flex-shrink-0 ml-1">
                <FileText size={10} />
                {currentPageIndex + 1} / {pages.length}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end">
            {/* Undo / Redo */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => dispatch(undoAnnotation({ sessionId: pageKey, participant }))}
                disabled={!(annotationHistory?.[pageKey]?.[participant]?.length)}
                title="Undo (⌘Z)"
                className="px-1.5 py-1 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
              ><Undo2 size={12}/></button>
              <div className="w-px h-3.5 bg-gray-200"/>
              <button
                onClick={() => dispatch(redoAnnotation({ sessionId: pageKey, participant }))}
                disabled={!(annotationFuture?.[pageKey]?.[participant]?.length)}
                title="Redo (⌘Y)"
                className="px-1.5 py-1 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
              ><Redo2 size={12}/></button>
            </div>
            {/* Auto-extract toggle */}
            <button
              title={autoExtract ? 'Auto-extract text on draw: ON' : 'Auto-extract text on draw: OFF'}
              onClick={() => setAutoExtract(v => !v)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors",
                autoExtract ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              )}
            >
              <Wand2 size={11} />
              {!isCompact && 'Auto'}
            </button>
            <button
              onClick={handleSave}
              disabled={!messageId || saveStatus === 'saving'}
              title={saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                saveStatus === 'saved' && "bg-green-50 text-green-600 border border-green-200",
                saveStatus === 'error' && "bg-red-50 text-red-600 border border-red-200",
                saveStatus === 'idle' && "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100",
                (saveStatus === 'saving') && "bg-gray-50 text-gray-600 border border-gray-200 opacity-40 cursor-not-allowed"
              )}
            >
              <Save size={12} />
              {!isCompact && (saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save')}
            </button>
            <div ref={exportBtnRef} className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                disabled={processingStatus === 'streaming' || processingStatus === 'loading' || processingStatus === 'uploading' || processingStatus === 'processing'}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={12} />
                {!isCompact && 'Export'}
                <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[130px]">
                  {[
                    { fmt: 'json', label: 'JSON' },
                    { fmt: 'html', label: 'HTML' },
                    { fmt: 'md',   label: 'Markdown' },
                    { fmt: 'docx', label: 'Word (DOCX)' },
                  ].map(({ fmt, label }) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <OcrAnnotationPanel
            annotations={annList}
            sessionId={pageKey}
            participant={participant}
            isStreaming={isStreaming}
            onExtractText={extractRegionText}
            extractingIds={extractingIds}
          />
        </div>
      </div>
    </div>
  );
}
