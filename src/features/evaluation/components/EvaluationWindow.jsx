import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';
import { fetchEvalSessionById } from '../store/evaluationSlice';
import { EvaluationUploadInput } from './EvaluationUploadInput';
import { EvaluationDocumentView } from './EvaluationDocumentView';

/** Routes the main area between upload, loading, error and the evaluation view. */
export function EvaluationWindow() {
  const dispatch = useDispatch();
  const { sessionId } = useParams();
  const { activeSession, pages, processingStatus, processingError } = useSelector(s => s.evaluation);

  if (sessionId && processingStatus === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <LoaderCircle size={30} className="animate-spin" />
      </div>
    );
  }

  const hasSession = activeSession && activeSession.id === sessionId && pages.length > 0;

  if (sessionId && !hasSession && processingStatus === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-medium text-gray-700">Failed to load this evaluation</p>
          {processingError && <p className="text-xs text-gray-400">{processingError}</p>}
          <button
            onClick={() => dispatch(fetchEvalSessionById(sessionId))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EvaluationUploadInput />
      </div>
    );
  }

  return <EvaluationDocumentView sessionId={activeSession.id} />;
}
