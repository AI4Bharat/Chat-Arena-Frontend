import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Info, X } from 'lucide-react';
import { setZoomLevel, setCanvasMode, setDrawType } from '../store/chatSlice';
import { TypeDropdown } from './TypeDropdown';

const SHORTCUTS = [
  { keys: ['⌘Z', 'Ctrl+Z'],       desc: 'Undo' },
  { keys: ['⌘⇧Z', 'Ctrl+Y'],      desc: 'Redo' },
  { keys: ['⌘D', 'Ctrl+D'],       desc: 'Duplicate selected box' },
  { keys: ['Del', 'Backspace'],    desc: 'Delete selected box' },
  { keys: ['Esc'],                 desc: 'Deselect box' },
  { keys: ['Right-click'],         desc: 'Context menu on box' },
];

export function OcrToolbar({ pageCount = 1, currentPage = 1 }) {
  const dispatch = useDispatch();
  const { zoomLevel, canvasMode, drawType } = useSelector(s => s.ocrChat);
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
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/60 text-xs">

      {/* Mode toggle — segmented pill */}
      <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
        <button
          title="Select / Move / Resize (Esc)"
          onClick={() => dispatch(setCanvasMode('select'))}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[10px] font-medium transition-all duration-150 ${
            canvasMode === 'select'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
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
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pencil size={12} />
          Draw
        </button>
      </div>

      {/* Draw-type selector — only visible in draw mode */}
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

      {/* Page indicator — only multi-page */}
      {pageCount > 1 && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <span className="tabular-nums text-gray-500">
            {currentPage} / {pageCount}
          </span>
        </>
      )}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Shortcuts info button */}
      <div className="relative">
        <button
          onClick={() => setShowShortcuts(v => !v)}
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${
            showShortcuts ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
          title="Keyboard shortcuts"
        >
          <Info size={13} />
        </button>

        {showShortcuts && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
            <div className="absolute bottom-full mb-3 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-64">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-gray-700">Keyboard shortcuts</span>
                <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              </div>
              <div className="space-y-1.5">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
