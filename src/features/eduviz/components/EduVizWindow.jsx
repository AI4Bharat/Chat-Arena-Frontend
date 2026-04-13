import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LoaderCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { EduVizUploadInput } from './EduVizUploadInput';
import { EduVizDocumentView } from './EduVizDocumentView';
import { fetchEduvizSessionById } from '../store/eduvizSlice';

/**
 * EduVizWindow — top-level state router for the EduViz main area.
 *
 * States:
 *   idle / uploading / processing → EduVizUploadInput
 *   loading → spinner
 *   error → error card with retry
 *   done / streaming → EduVizDocumentView
 */
export function EduVizWindow() {
  const dispatch = useDispatch();
  const { sessionId: urlSessionId } = useParams();
  const { activeSession, processingStatus, processingError } = useSelector(s => s.eduviz);

  // Loading state
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

  // Error state
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
            onClick={() => dispatch(fetchEduvizSessionById(urlSessionId))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ready to show document view
  const isReady = (processingStatus === 'done' || processingStatus === 'streaming')
    && activeSession
    && (!urlSessionId || activeSession.id === urlSessionId);

  if (!isReady) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto w-full">
        <div className="min-h-full flex flex-col items-center py-8">
          <EduVizUploadInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EduVizDocumentView sessionId={activeSession.id} />
    </div>
  );
}
