import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { OcrUploadInput } from './OcrUploadInput';
import { OcrDocumentView } from './OcrDocumentView';
import { OcrCompareView } from './OcrCompareView';

/**
 * OcrWindow — top-level state router for the OCR arena main area.
 *
 * States:
 *   idle / uploading / processing / session mismatch → OcrUploadInput
 *   done + activeSession matches URL sessionId, direct mode → OcrDocumentView
 *   done + activeSession matches URL sessionId, compare mode → OcrCompareView
 */
export function OcrWindow() {
  const { sessionId: urlSessionId } = useParams();
  const { activeSession, processingStatus } = useSelector(s => s.ocrChat);

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
