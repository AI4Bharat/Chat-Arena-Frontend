import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ClipboardCheck, PanelLeftClose, PanelLeftOpen, Plus, ScanText, Trash2 } from 'lucide-react';
import { AuthPromptBanner } from '../../auth/components/AuthPromptBanner';
import { useTenant } from '../../../shared/context/TenantContext';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';
import {
  clearEvaluation, deleteEvalSession, fetchEvalSessionById, fetchEvalSessions,
} from '../store/evaluationSlice';
import { EvaluationModelSelector } from './EvaluationModelSelector';
import { EvaluationWindow } from './EvaluationWindow';

function EvaluationSidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId, tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  const tenant = urlTenant || contextTenant;
  const sessions = useSelector(s => s.evaluation.sessions);
  const go = (route) => navigate(tenant ? `/${tenant}/${route}` : `/${route}`);

  useEffect(() => { dispatch(fetchEvalSessions()); }, [dispatch]);

  const handleNew = () => {
    dispatch(clearEvaluation());
    go('evaluate');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this evaluation?')) return;
    await dispatch(deleteEvalSession(id));
    if (id === sessionId) go('evaluate');
  };

  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center gap-2 w-14 border-r border-gray-200 bg-white py-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100" title="Open sidebar">
          <PanelLeftOpen size={18} />
        </button>
        <button onClick={handleNew} className="p-2 rounded-lg hover:bg-gray-100" title="New evaluation">
          <Plus size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col bg-white border-r border-gray-200">
      <div className="flex items-center justify-between px-4 h-[64px] border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <ClipboardCheck size={18} className="text-orange-500" />
          AI Evaluation
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100" title="Close sidebar">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="p-2 space-y-1">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus size={16} /> New evaluation
        </button>
        <button
          onClick={() => go('ocr')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <ScanText size={16} /> OCR Arena
        </button>
      </div>

      <div className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Evaluations</div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {sessions.length === 0 && <p className="px-2 py-2 text-xs text-gray-400">No evaluations yet.</p>}
        {sessions.map(s => (
          <div
            key={s.id}
            onClick={() => go(`evaluate/${s.id}`)}
            className={`group flex items-center gap-2 px-3 py-2 mb-0.5 rounded-lg text-sm cursor-pointer ${
              s.id === sessionId ? 'bg-orange-100 text-orange-800' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ClipboardCheck size={15} className="flex-shrink-0 opacity-70" />
            <span className="flex-1 truncate">{s.title || 'Untitled evaluation'}</span>
            <button
              onClick={(e) => handleDelete(e, s.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/70"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function EvaluationLayout() {
  const dispatch = useDispatch();
  const { sessionId } = useParams();
  const activeSession = useSelector(s => s.evaluation.activeSession);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768);

  useEffect(() => {
    if (sessionId && activeSession?.id !== sessionId) dispatch(fetchEvalSessionById(sessionId));
    if (!sessionId && activeSession) dispatch(clearEvaluation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, dispatch]);

  useDocumentTitle('AI Answer Evaluation');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AuthPromptBanner session_type="OCR" />
      <div className="flex flex-1 overflow-hidden">
        <EvaluationSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(o => !o)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white border-b border-gray-200 px-2 sm:px-4 md:px-6 flex-shrink-0">
            <div className="flex items-center gap-2 h-[64px]">
              {!isSidebarOpen && (
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setIsSidebarOpen(true)}>
                  <PanelLeftOpen size={20} />
                </button>
              )}
              <EvaluationModelSelector />
            </div>
          </header>
          <EvaluationWindow />
        </div>
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}
