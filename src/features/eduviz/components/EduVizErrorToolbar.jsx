import { useDispatch, useSelector } from 'react-redux';
import { MousePointer2, Pencil, ZoomIn, ZoomOut } from 'lucide-react';
import { setCanvasMode, setDrawType, setZoomLevel } from '../store/eduvizSlice';
import {
  setCanvasMode as setOcrCanvasMode,
  setDrawType as setOcrDrawType,
  setZoomLevel as setOcrZoomLevel,
} from '../../ocr/store/chatSlice';
import { EDUVIZ_TYPE_OPTIONS, EDUVIZ_TYPE_COLORS } from '../utils/eduvizTypeColors';

export function EduVizErrorToolbar() {
  const dispatch = useDispatch();
  const { zoomLevel, canvasMode, drawType } = useSelector(s => s.eduviz);

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

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/60 text-xs flex-nowrap">

      {/* Mode toggle */}
      <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
        <button
          title="Select / Move / Resize"
          onClick={() => dispatchMode('select')}
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
          title="Draw error box"
          onClick={() => dispatchMode('draw')}
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

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Error type labels */}
      <div className="flex items-center gap-1">
        {EDUVIZ_TYPE_OPTIONS.map(opt => {
          const isActive = drawType === opt.value;
          const color = EDUVIZ_TYPE_COLORS[opt.value];
          return (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => {
                dispatchDrawType(opt.value);
                if (canvasMode !== 'draw') dispatchMode('draw');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150 border ${
                isActive
                  ? 'shadow-sm'
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}
              style={isActive ? {
                backgroundColor: color + '15',
                borderColor: color + '40',
                color: color,
              } : {}}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="hidden sm:inline">{opt.label.replace(' Error', '')}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.1}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-35 transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <span className="tabular-nums w-10 text-center text-gray-700 font-medium">
          {zoomPercent}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3.0}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-35 transition-colors"
        >
          <ZoomIn size={14} />
        </button>
      </div>
    </div>
  );
}
