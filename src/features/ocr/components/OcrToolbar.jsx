import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Info, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { setZoomLevel, setCanvasMode, setDrawType, setCurrentPageIndex } from '../store/chatSlice';
import { TypeDropdown } from './TypeDropdown';

const SHORTCUTS = [
  { keys: ['⌘Z', 'Ctrl+Z'],       desc: 'Undo' },
  { keys: ['⌘⇧Z', 'Ctrl+Y'],      desc: 'Redo' },
  { keys: ['⌘D', 'Ctrl+D'],       desc: 'Duplicate selected box' },
  { keys: ['Del', 'Backspace'],    desc: 'Delete selected box' },
  { keys: ['Esc'],                 desc: 'Deselect box' },
  { keys: ['Right-click'],         desc: 'Context menu on box' },
];

export function OcrToolbar() {
  const dispatch = useDispatch();
  const { zoomLevel, canvasMode, drawType, pages, currentPageIndex } = useSelector(s => s.ocrChat);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [zoomInput, setZoomInput] = useState(null); // null = display mode, string = editing

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
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/95 dark:bg-[#2a2a2a] backdrop-blur-sm shadow-lg border border-gray-200/60 dark:border-[#3a3a3a] text-xs flex-nowrap">

      {/* Mode toggle — segmented pill */}
      <div className="flex items-center bg-gray-100 dark:bg-[#333333] rounded-xl p-0.5">
        <button
          title="Select / Move / Resize (Esc)"
          onClick={() => dispatch(setCanvasMode('select'))}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[10px] font-medium transition-all duration-150 ${
            canvasMode === 'select'
              ? 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-[#ececec] shadow-sm'
              : 'text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#ececec]'
          }`}
        >
          <MousePointer2 size={12} />
          Select
        </button>
        <button
          title="Draw a new box"
          onClick={() => dispatch(setCanvasMode('draw'))}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[10px] font-medium transition-all duration-150 ${
            canvasMode === 'draw'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#ececec]'
          }`}
        >
          <Pencil size={12} />
          Draw
        </button>
      </div>

      {/* Draw-type selector — only visible in draw mode */}
      {canvasMode === 'draw' && (
        <>
          <div className="w-px h-5 bg-gray-200 dark:bg-[#3a3a3a] mx-1" />
          <TypeDropdown
            value={drawType}
            onChange={type => dispatch(setDrawType(type))}
          />
        </>
      )}

      <div className="w-px h-5 bg-gray-200 dark:bg-[#3a3a3a] mx-1" />

      {/* Zoom — compact − value + */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.1}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-500 dark:text-[#a0a0a0] disabled:opacity-35 transition-colors"
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
            className="tabular-nums w-10 text-center text-gray-700 dark:text-[#ececec] font-medium bg-gray-100 dark:bg-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        ) : (
          <span
            title="Click to set zoom"
            onClick={() => setZoomInput(String(zoomPercent))}
            className="tabular-nums w-10 text-center text-gray-700 dark:text-[#ececec] font-medium cursor-text hover:bg-gray-100 dark:hover:bg-[#333333] rounded-md px-1 transition-colors"
          >
            {zoomPercent}%
          </span>
        )}
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3.0}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-500 dark:text-[#a0a0a0] disabled:opacity-35 transition-colors"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Page navigator — only multi-page */}
      {pages.length > 1 && (
        <>
          <div className="w-px h-5 bg-gray-200 dark:bg-[#3a3a3a] mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => dispatch(setCurrentPageIndex(currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-500 dark:text-[#a0a0a0] disabled:opacity-30 transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-gray-600 dark:text-[#a0a0a0] tabular-nums text-[11px] font-medium whitespace-nowrap">
              <FileText size={10} className="flex-shrink-0" />
              {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={() => dispatch(setCurrentPageIndex(currentPageIndex + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-500 dark:text-[#a0a0a0] disabled:opacity-30 transition-colors"
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      <div className="w-px h-5 bg-gray-200 dark:bg-[#3a3a3a] mx-1" />

      {/* Shortcuts info button */}
      <div className="relative">
        <button
          onClick={() => setShowShortcuts(v => !v)}
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${
            showShortcuts ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' : 'hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-400 dark:text-[#a0a0a0] hover:text-gray-600 dark:hover:text-[#ececec]'
          }`}
          title="Keyboard shortcuts"
        >
          <Info size={13} />
        </button>

        {showShortcuts && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
            <div className="absolute bottom-full mb-3 right-0 z-50 bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-xl border border-gray-100 dark:border-[#3a3a3a] p-3 w-64">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-[#ececec]">Keyboard shortcuts</span>
                <button onClick={() => setShowShortcuts(false)} className="text-gray-400 dark:text-[#a0a0a0] hover:text-gray-600 dark:hover:text-[#ececec]">
                  <X size={13} />
                </button>
              </div>
              <div className="space-y-1.5">
                {SHORTCUTS.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">{desc}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {keys.map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-[#333333] border border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-[#ececec] font-mono" style={{ fontSize: '0.65rem' }}>
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
