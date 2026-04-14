import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { LoaderCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { EduVizUploadInput } from './EduVizUploadInput';
import { EduVizDocumentView } from './EduVizDocumentView';
import { fetchEduvizSessionById, clearEduvizState } from '../store/eduvizSlice';
import { EduVizAuthBarrier } from './EduVizAuthBarrier';
import { EduVizDashboard } from './EduVizDashboard';

/**
 * EduVizWindow — top-level state router for the EduViz main area.
 *
 * States:
 *   idle / uploading / processing → EduVizUploadInput
 *   loading → spinner
 *   error → error card with retry
 *   done / streaming → EduVizDocumentView
 */
export function EduVizWindow({ showUpload, setShowUpload }) {
  const dispatch = useDispatch();
  const { activeSession, processingStatus, processingError } = useSelector(s => s.eduviz);
  const { isAnonymous } = useSelector(s => s.auth);
  const { sessionId: urlSessionId } = useParams();

  // ── Auto-load session from URL ─────────────────────────────────────────────
  useEffect(() => {
    if (isAnonymous) return;
    if (urlSessionId) {
      if (!activeSession || activeSession.id !== urlSessionId) {
        dispatch(fetchEduvizSessionById(urlSessionId));
      }
      setShowUpload(false);
    } else {
      // If we're at the root, ensure we clear active sessions IF we are not in the upload flow
      if (!showUpload && (activeSession || processingStatus !== 'idle')) {
        dispatch(clearEduvizState());
      }
    }
  }, [urlSessionId, dispatch, isAnonymous, activeSession, processingStatus, showUpload, setShowUpload]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Anonymous access barrier ────────────────────────────────────────────────
  if (isAnonymous) {
    return <EduVizAuthBarrier />;
  }

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

  // Workspace View (Active session matching URL ID)
  const isWorkspace = (processingStatus === 'done' || processingStatus === 'streaming')
    && activeSession
    && urlSessionId
    && activeSession.id === urlSessionId;

  if (isWorkspace) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <EduVizDocumentView
          key={activeSession.id}
          sessionId={activeSession.id}
        />
      </div>
    );
  }

  // Upload View (New Annotation flow)
  if (showUpload) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto w-full">
        <div className="min-h-full flex flex-col items-center py-8">
          <div className="max-w-4xl w-full px-4 mb-6">
            <button 
              onClick={() => setShowUpload(false)}
              className="text-sm font-bold text-gray-400 hover:text-orange-600 flex items-center gap-2 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          <EduVizUploadInput />
        </div>
      </div>
    );
  }

  // Dashboard View (Default)
  return <EduVizDashboard onStartNew={() => setShowUpload(true)} />;
}
