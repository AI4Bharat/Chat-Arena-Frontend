import { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MousePointer2, Pencil, ZoomIn, ZoomOut } from 'lucide-react';
import { setCanvasMode, setDrawType, setZoomLevel, updateAnnotationType, toggleAnnotationLabel } from '../store/eduvizSlice';
import {
  setCanvasMode as setOcrCanvasMode,
  setDrawType as setOcrDrawType,
  setZoomLevel as setOcrZoomLevel,
} from '../../ocr/store/chatSlice';
import { EDUVIZ_TYPE_OPTIONS, EDUVIZ_TYPE_COLORS } from '../utils/eduvizTypeColors';

export function EduVizErrorToolbar({ vertical = false }) {
  const dispatch = useDispatch();
  const { zoomLevel, canvasMode, drawType, selectedAnnotationId, activeSession, currentPageIndex, editedAnnotations } = useSelector(s => s.eduviz);
  const pageKey = activeSession ? `${activeSession.id}_${currentPageIndex}` : null;
  const participant = 'modelA';
  const selectedAnn = (selectedAnnotationId && pageKey) ? editedAnnotations[pageKey]?.[participant]?.[selectedAnnotationId] : null;

  const zoomPercent = Math.round(zoomLevel * 100);
  const handleZoomIn  = () => {
    const z = Math.min(3.0, zoomLevel + 0.15);
    dispatch(setZoomLevel(z));
    dispatch(setOcrZoomLevel(z));
  };
  const handleZoomOut = () => {
    const z = Math.max(0.1, zoomLevel - 0.15);
    dispatch(setZoomLevel(z));
    dispatch(setOcrZoomLevel(z));
  };

  const dispatchMode = (mode) => {
    dispatch(setCanvasMode(mode));
    dispatch(setOcrCanvasMode(mode));
  };

  const dispatchDrawType = (type) => {
    dispatch(setDrawType(type));
    dispatch(setOcrDrawType(type));
  };

  const [inputVal, setInputVal] = useState(zoomPercent.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const ZOOM_PRESETS = [50, 75, 90, 100, 125, 150, 200];

  // Sync internal input value with Redux zoomPercent when NOT typing
  useEffect(() => {
    if (!isEditing) {
      setInputVal(zoomPercent.toString());
    }
  }, [zoomPercent, isEditing]);

  const commitZoom = (val) => {
    let numeric = parseInt(val.replace('%', ''), 10);
    if (isNaN(numeric)) return;
    // Clamp between 10% and 300%
    numeric = Math.max(10, Math.min(300, numeric));
    const newLevel = numeric / 100;
    dispatch(setZoomLevel(newLevel));
    dispatch(setOcrZoomLevel(newLevel));
    setInputVal(numeric.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitZoom(inputVal);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputVal(zoomPercent.toString());
      setIsEditing(false);
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`flex ${vertical ? 'flex-col items-center w-full gap-4 pb-4' : 'items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-2xl bg-white/98 backdrop-blur-md shadow-xl border border-gray-200/80 text-[10px] sm:text-xs flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:h-0'}`}>

      {/* Mode toggle (Top) */}
      <div className={`flex ${vertical ? 'flex-col w-full' : 'items-center'} bg-gray-100/80 rounded-xl p-1 gap-1`}>
        <button
          title="Select / Move / Resize"
          onClick={() => dispatchMode('select')}
          className={`flex ${vertical ? 'flex-col items-center py-2.5 w-full gap-1.5' : 'items-center gap-1.5 px-3 py-1'} justify-center rounded-[10px] font-medium transition-all duration-150 ${
            canvasMode === 'select'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <MousePointer2 size={vertical ? 16 : 12} />
          <span className={vertical ? 'text-[8.5px] uppercase tracking-widest font-bold opacity-80 leading-none' : ''}>Select</span>
        </button>
        <button
          title="Draw error box"
          onClick={() => dispatchMode('draw')}
          className={`flex ${vertical ? 'flex-col items-center py-2.5 w-full gap-1.5' : 'items-center gap-1.5 px-3 py-1'} justify-center rounded-[10px] font-medium transition-all duration-150 ${
            canvasMode === 'draw'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Pencil size={vertical ? 16 : 12} />
          <span className={vertical ? 'text-[8.5px] uppercase tracking-widest font-bold opacity-80 leading-none' : ''}>Draw</span>
        </button>
      </div>

      <div className={`${vertical ? 'w-8 h-px' : 'w-px h-5'} bg-gray-200/80 my-0.5`} />

      {/* Error type labels */}
      <div className={`flex ${vertical ? 'flex-col gap-2 w-full' : 'items-center gap-1.5'}`}>
        {EDUVIZ_TYPE_OPTIONS.map(opt => {
          const isSelectedActive = selectedAnn?.labels?.includes(opt.value) || (!selectedAnn?.labels && selectedAnn?.type === opt.value);
          const isActive = selectedAnn ? isSelectedActive : drawType === opt.value;
          const color = EDUVIZ_TYPE_COLORS[opt.value];
          return (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => {
                if (selectedAnnotationId && pageKey) {
                  dispatch(toggleAnnotationLabel({
                    sessionId: pageKey,
                    participant,
                    annotationId: selectedAnnotationId,
                    label: opt.value
                  }));
                } else {
                  dispatchDrawType(opt.value);
                  if (canvasMode !== 'draw') dispatchMode('draw');
                }
              }}
              className={`flex ${vertical ? 'flex-col gap-1 w-full py-1.5 items-center' : 'items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5'} rounded-xl font-medium transition-all duration-150 border ${
                isActive
                  ? 'shadow-sm shadow-black/5 ring-1 ring-black/5'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'
              }`}
              style={isActive ? {
                backgroundColor: color + '12',
                borderColor: color + '40',
                color: color,
              } : {}}
            >
              <span
                className={`${vertical ? 'w-[12px] h-[12px]' : 'w-2.5 h-2.5'} rounded-full flex-shrink-0 shadow-sm`}
                style={{ backgroundColor: color }}
              />
              <span className={vertical ? 'text-[8.5px] uppercase tracking-wider font-bold leading-tight text-center opacity-[0.85] max-w-[75px] truncate' : 'hidden sm:inline'}>
                 {opt.label.replace(' Error', '')}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${vertical ? 'w-8 h-px' : 'w-px h-5'} bg-gray-200/80 my-0.5`} />

      {/* Zoom */}
      <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-1 bg-gray-50/80 rounded-xl p-1`}>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3.0}
          className={`flex items-center justify-center rounded-[10px] hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-35 transition-all ${vertical ? 'w-7 h-7' : 'w-6 h-6'}`}
        >
          <ZoomIn size={vertical ? 16 : 14} />
        </button>
        <div className={`relative flex items-center justify-center ${vertical ? 'w-full' : 'w-11'}`}>
          <input
            type="text"
            value={isEditing ? inputVal : `${zoomPercent}%`}
            onFocus={() => {
              setIsEditing(true);
              setShowPresets(true);
              setInputVal(zoomPercent.toString());
            }}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={() => {
              // Delay slightly to allow preset clicks
              setTimeout(() => {
                commitZoom(inputVal);
                setShowPresets(false);
              }, 150);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full bg-transparent text-center text-[10px] text-gray-500 font-bold outline-none tabular-nums hover:text-gray-900 focus:text-orange-600 transition-colors ${vertical ? 'py-1' : ''}`}
          />
          {showPresets && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-1.5 min-w-[80px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150" style={{ bottom: 'auto' }}>
              {ZOOM_PRESETS.map(preset => (
                <button
                  key={preset.toString()}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur before click
                    commitZoom(preset.toString());
                  }}
                  className="w-full text-center px-4 py-1.5 text-[10px] font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors border-none"
                >
                  {preset}%
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.25}
          className={`flex items-center justify-center rounded-[10px] hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-35 transition-all ${vertical ? 'w-7 h-7' : 'w-6 h-6'}`}
        >
          <ZoomOut size={vertical ? 16 : 14} />
        </button>
      </div>
    </div>
  );
}
