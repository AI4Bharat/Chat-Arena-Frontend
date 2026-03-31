import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Info, ChevronLeft, ChevronRight, FileText, Columns2, Rows2 } from 'lucide-react';
import { setZoomLevel, setCanvasMode, setDrawType, setCurrentPageIndex } from '../store/chatSlice';
import { TypeDropdown } from './TypeDropdown';
import { cn } from '../../../shared/utils';

const SHORTCUTS = [
  { keys: ['⌘Z', 'Ctrl+Z'],       desc: 'Undo' },
  { keys: ['⌘⇧Z', 'Ctrl+Y'],      desc: 'Redo' },
  { keys: ['⌘D', 'Ctrl+D'],       desc: 'Duplicate selected box' },
  { keys: ['Del', 'Backspace'],    desc: 'Delete selected box' },
  { keys: ['Esc'],                 desc: 'Deselect box' },
  { keys: ['Right-click'],         desc: 'Context menu on box' },
];

const CANVAS_ACTIONS = [
  { action: 'Click box',           desc: 'Select & resize' },
  { action: 'Drag empty area',     desc: 'Draw new box (Draw mode)' },
  { action: 'Drag box',            desc: 'Move box' },
  { action: 'Drag corner handle',  desc: 'Resize box' },
];

export function OcrToolbar({ layout = {}, actions = {} }) {
  const { compact = false, viewMode = 'split', hideViewToggle = false } = layout;
  const { onViewModeChange = () => {} } = actions;
  const dispatch = useDispatch();
  const { zoomLevel, canvasMode, drawType, pages, currentPageIndex } = useSelector(s => s.ocrChat);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [zoomInput, setZoomInput] = useState(null); // null = display mode, string = editing
  const infoButtonRef = useRef(null);

  useEffect(() => {
    if (!showShortcuts) return;
    const handler = e => { if (!infoButtonRef.current?.contains(e.target)) setShowShortcuts(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showShortcuts]);

  const zoomPercent = Math.round(zoomLevel * 100);

  const handleZoomIn  = () => dispatch(setZoomLevel(Math.min(3.0, zoomLevel + 0.15)));
  const handleZoomOut = () => dispatch(setZoomLevel(Math.max(0.1, zoomLevel - 0.15)));

  const commitZoom = (raw) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      dispatch(setZoomLevel(Math.min(300, Math.max(10, parsed)) / 100));
    }
    setZoomInput(null);
  };

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/60 pointer-events-auto overflow-hidden flex max-w-full transition-all duration-300">
      <div className={cn(
        "flex items-center gap-1 px-2 py-1.5 text-xs flex-nowrap max-w-full",
        compact && "overflow-x-auto [&::-webkit-scrollbar]:h-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth"
      )}>

      {/* Mode toggle — segmented pill */}
      <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
        <button
          title="Select / Move / Resize (Esc)"
          onClick={() => dispatch(setCanvasMode('select'))}
          className={cn(
            "flex items-center gap-1.5 rounded-[10px] font-medium transition-all duration-150",
            compact ? "px-2 py-1" : "px-3 py-1",
            canvasMode === 'select' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <MousePointer2 size={12} />
          {!compact && 'Select'}
        </button>

        <div className="w-px h-4 bg-gray-300 mx-0.5 opacity-50" />

        <button
          title="Draw a new box"
          onClick={() => dispatch(setCanvasMode('draw'))}
          className={cn(
            "flex items-center gap-1.5 rounded-[10px] font-medium transition-all duration-150",
            compact ? "px-2 py-1" : "px-3 py-1",
            canvasMode === 'draw' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Pencil size={12} />
          {!compact && 'Draw'}
        </button>
      </div>

      {/* Draw-type selector — only in draw mode */}
      {canvasMode === 'draw' && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <TypeDropdown
            value={drawType}
            onChange={type => dispatch(setDrawType(type))}
          />
        </>
      )}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Zoom — compact − value + */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.1}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-35 transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        {zoomInput !== null ? (
          <input
            autoFocus
            type="text"
            value={zoomInput}
            onChange={e => setZoomInput(e.target.value)}
            onBlur={() => commitZoom(zoomInput)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitZoom(zoomInput);
              if (e.key === 'Escape') setZoomInput(null);
            }}
            className="tabular-nums w-10 text-center text-gray-700 font-medium bg-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        ) : (
          <span
            title="Click to set zoom"
            onClick={() => setZoomInput(String(zoomPercent))}
            className="tabular-nums w-10 text-center text-gray-700 font-medium cursor-text hover:bg-gray-100 rounded-md px-1 transition-colors"
          >
            {zoomPercent}%
          </span>
        )}
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3.0}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-35 transition-colors"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Page navigator — only multi-page */}
      {pages.length > 1 && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => dispatch(setCurrentPageIndex(currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-gray-600 tabular-nums text-[11px] font-medium whitespace-nowrap">
              <FileText size={10} className="flex-shrink-0" />
              {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={() => dispatch(setCurrentPageIndex(currentPageIndex + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {/* View mode — 2-button pill */}
      {!hideViewToggle && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 flex-shrink-0">
            <button
              title="Side-by-side view"
              onClick={() => onViewModeChange('split')}
              className={cn(
                "flex items-center px-2 py-1 rounded-[10px] transition-all duration-150",
                viewMode === 'split' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Columns2 size={12} />
            </button>
            <button
              title="Top / bottom view"
              onClick={() => onViewModeChange('stacked')}
              className={cn(
                "flex items-center px-2 py-1 rounded-[10px] transition-all duration-150",
                viewMode === 'stacked' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Rows2 size={12} />
            </button>
          </div>
        </>
      )}

      <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

      {/* Shortcuts info button */}
      <div className="relative flex-shrink-0">
        <button
          ref={infoButtonRef}
          onClick={() => setShowShortcuts(v => !v)}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
            showShortcuts ? "bg-orange-50 text-orange-500" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          )}
          title="Shortcuts & help"
        >
          <Info size={13} />
        </button>

        {showShortcuts && (
          <div className="absolute bottom-full mb-3 right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64 max-h-[70vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Keyboard</p>
              <div className="space-y-1.5 mb-3">
                {SHORTCUTS.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">{desc}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {keys.map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-600 font-mono" style={{ fontSize: '0.65rem' }}>
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Canvas</p>
              <div className="space-y-1.5 mb-3">
                {CANVAS_ACTIONS.map(({ action, desc }) => (
                  <div key={action} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-500 shrink-0">{desc}</span>
                    <span className="text-xs text-gray-400 text-right">{action}</span>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
    </div>
  );
}
