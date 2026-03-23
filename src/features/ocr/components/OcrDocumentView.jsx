import { useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Send, Wand2 } from 'lucide-react';
import { OcrCanvas } from './OcrCanvas';
import { OcrAnnotationPanel } from './OcrAnnotationPanel';
import { OcrToolbar } from './OcrToolbar';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { updateAnnotationText } from '../store/chatSlice';

const MIN_LEFT_PCT = 50;
const MAX_LEFT_PCT = 75;

/**
 * OcrDocumentView — split-pane view with a draggable divider.
 * Left (50–75%): image canvas + floating toolbar.
 * Right (25–50%): scrollable annotation cards.
 */
export function OcrDocumentView({ sessionId, participant = 'modelA' }) {
  const dispatch = useDispatch();
  const { currentImage, annotations, annotationMessageIds, processingStatus } = useSelector(s => s.ocrChat);
  const isStreaming = processingStatus === 'streaming';
  const [leftPct, setLeftPct] = useState(50);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [autoExtract, setAutoExtract] = useState(true);
  const [extractingIds, setExtractingIds] = useState(new Set());
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const sessionAnnotations = annotations[sessionId] || { modelA: [], modelB: [] };
  const annList = sessionAnnotations[participant] || [];
  const messageId = annotationMessageIds?.[sessionId]?.[participant];

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

  const handleSubmit = useCallback(() => {
    console.log('Submitted', { sessionId, participant, annotations: annList });
  }, [sessionId, participant, annList]);

  const extractRegionText = useCallback(async (annotationId, box) => {
    if (!messageId) return;
    setExtractingIds(prev => new Set(prev).add(annotationId));
    try {
      const res = await apiClient.post(endpoints.messages.extractRegionText(messageId), { box });
      const text = res.data?.text ?? '';
      dispatch(updateAnnotationText({ sessionId, participant, annotationId, text }));
    } catch (err) {
      console.error('Region text extraction failed:', err);
    } finally {
      setExtractingIds(prev => { const next = new Set(prev); next.delete(annotationId); return next; });
    }
  }, [messageId, sessionId, participant, dispatch]);

  // Called by OcrCanvas after a new box is drawn (auto-extract path)
  const handleBoxDrawn = useCallback((annotation) => {
    if (autoExtract) extractRegionText(annotation.id, annotation.box);
  }, [autoExtract, extractRegionText]);

  const handleDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  if (!currentImage) return null;

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Left: Canvas + floating toolbar */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ width: `${leftPct}%` }}
      >
        <OcrCanvas
          imageUrl={currentImage.url}
          imageWidth={currentImage.width}
          imageHeight={currentImage.height}
          annotations={annList}
          sessionId={sessionId}
          participant={participant}
          onBoxDrawn={handleBoxDrawn}
        />

        {/* Floating toolbar — bottom-center overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <OcrToolbar />
        </div>
      </div>

      {/* Draggable divider */}
      <div
        className="group relative flex-shrink-0 flex items-center justify-center cursor-col-resize select-none"
        style={{ width: 8 }}
        onMouseDown={handleDividerMouseDown}
      >
        {/* Base line — 2px centered, thicker & orange so it reads as a handle not a scrollbar */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 group-hover:bg-orange-400 transition-colors duration-150" />
        {/* Grip pill — always visible, reinforces "draggable" intent */}
        <div className="relative z-10 flex flex-col gap-[3px] px-0.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-orange-300 group-hover:shadow-orange-100 transition-all duration-150">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-400 group-hover:bg-orange-500 transition-colors duration-150" />
          ))}
        </div>
      </div>

      {/* Right: Annotation Panel — flex-1 takes remaining space after left panel + divider */}
      <div
        className="flex-1 flex flex-col bg-white overflow-hidden min-w-0"
      >
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annotations</span>
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
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Auto-extract toggle */}
            <button
              title={autoExtract ? 'Auto-extract text on draw: ON' : 'Auto-extract text on draw: OFF'}
              onClick={() => setAutoExtract(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                autoExtract
                  ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Wand2 size={11} />
              Auto
            </button>
            <button
              onClick={handleSave}
              disabled={!messageId || saveStatus === 'saving'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : saveStatus === 'error'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Save size={12} />
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Send size={12} />
              Submit
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <OcrAnnotationPanel
            annotations={annList}
            sessionId={sessionId}
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
