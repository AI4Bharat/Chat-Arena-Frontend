import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LoaderCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { OcrUploadInput } from './OcrUploadInput';
import { OcrDocumentView } from './OcrDocumentView';
import { OcrCompareView } from './OcrCompareView';
import { fetchSessionById } from '../store/chatSlice';

/**
 * OcrWindow — top-level state router for the OCR arena main area.
 *
 * States:
 *   idle / uploading / processing / session mismatch → OcrUploadInput
 *   loading (fetching session by URL id) → spinner
 *   error (session fetch failed) → error card with retry
 *   done + activeSession matches URL sessionId, direct mode → OcrDocumentView
 *   done + activeSession matches URL sessionId, compare mode → OcrCompareView
 */
export function OcrWindow() {
  const dispatch = useDispatch();
  const { sessionId: urlSessionId } = useParams();
  const { activeSession, processingStatus, processingError } = useSelector(s => s.ocrChat);

  // Show loader while fetching a session by URL id
  if (processingStatus === 'loading' && urlSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <LoaderCircle size={32} className="animate-spin" />
          <span className="text-sm">Loading session…</span>
        </div>
      </div>
    );
  }

  // Show error card when session fetch failed
  if (processingStatus === 'error' && urlSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Failed to load session</p>
            {processingError && (
              <p className="mt-1 text-xs text-gray-400">{processingError}</p>
            )}
          </div>
          <button
            onClick={() => dispatch(fetchSessionById(urlSessionId))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only show document view if session is loaded AND matches the current URL
  const isReady = (processingStatus === 'done' || processingStatus === 'streaming')
    && activeSession
    && (!urlSessionId || activeSession.id === urlSessionId);

  const isCompare = activeSession?.mode === 'compare' || activeSession?.mode === 'random';

  if (!isReady) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <OcrUploadInput />
      </div>
    );
  }

  if (isCompare) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <OcrCompareView sessionId={activeSession.id} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <OcrDocumentView sessionId={activeSession.id} participant="modelA" />
    </div>
  );
}
