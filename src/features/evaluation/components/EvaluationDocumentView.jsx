import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronLeft, ChevronRight, Download, Eye, EyeOff, MousePointer2, Save, SquareDashed, SquarePlus, ZoomIn, ZoomOut,
} from 'lucide-react';
import { EvaluationCanvas } from './EvaluationCanvas';
import { EvaluationPanel } from './EvaluationPanel';
import { EvaluationChatPopup } from './EvaluationChat';
import {
  addItem, deleteItem, pageKeyOf, saveEvaluation, selectMaxMarks, setChatScope, setCurrentPageIndex,
  setChatOpen, setSelectedId, setTool, setZoom, updateItem,
} from '../store/evaluationSlice';
import { exportEvaluationCsv, exportEvaluationJson } from '../utils/evaluationExport';

function uniqueId(items, base) {
  const ids = new Set(items.map(i => i.id));
  let n = 1;
  while (ids.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

function containsCenter(outer, inner) {
  const cx = (inner[0] + inner[2]) / 2;
  const cy = (inner[1] + inner[3]) / 2;
  return outer[0] <= cx && cx <= outer[2] && outer[1] <= cy && cy <= outer[3];
}

function ToolButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export function EvaluationDocumentView({ sessionId }) {
  const dispatch = useDispatch();
  const {
    activeSession, pages, currentPageIndex, annotations, pageStatus, pageErrors,
    selectedId, tool, drawAnswerId, zoom, dirty, saveStatus, chatOpen, chatBusy, chatTurns,
  } = useSelector(s => s.evaluation);
  const maxMarks = useSelector(selectMaxMarks);
  const [showFindings, setShowFindings] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatHeight, setChatHeight] = useState(0);
  const [seenTurns, setSeenTurns] = useState(chatTurns.length);
  const exportRef = useRef(null);

  const pageKey = pageKeyOf(sessionId, currentPageIndex);
  const page = pages[currentPageIndex];
  const items = useMemo(() => annotations[pageKey] || [], [annotations, pageKey]);
  const isDirty = Object.values(dirty).some(Boolean);

  // Findings are numbered per page, grouped under their answers in answer order.
  const findingNumbers = useMemo(() => {
    const answerOrder = items.filter(i => i.kind === 'answer').map(a => a.id);
    const findings = items.filter(i => i.kind === 'finding');
    findings.sort((a, b) => {
      const ia = answerOrder.indexOf(a.answer_id);
      const ib = answerOrder.indexOf(b.answer_id);
      return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
    });
    return Object.fromEntries(findings.map((f, i) => [f.id, i + 1]));
  }, [items]);

  const summary = useMemo(() => {
    let awarded = 0;
    let max = 0;
    let answers = 0;
    pages.forEach((_, i) => {
      (annotations[pageKeyOf(sessionId, i)] || []).filter(a => a.kind === 'answer').forEach(a => {
        awarded += Number(a.marks_awarded) || 0;
        max += Number(a.max_marks) || 0;
        answers += 1;
      });
    });
    return { awarded, max, answers, pages: pages.length, maxPerQuestion: maxMarks };
  }, [annotations, pages, sessionId, maxMarks]);

  const onSelect = useCallback((id) => dispatch(setSelectedId(id)), [dispatch]);
  const onUpdate = useCallback((id, changes) => dispatch(updateItem({ pageKey, id, changes })), [dispatch, pageKey]);
  const onDelete = useCallback((id) => dispatch(deleteItem({ pageKey, id })), [dispatch, pageKey]);

  const onCreate = useCallback((box) => {
    if (tool === 'answer') {
      const id = uniqueId(items, 'q');
      dispatch(addItem({ pageKey, item: {
        id, kind: 'answer', question: `Q${id.slice(1)}`, question_text: '', box,
        category: 'correct', marks_awarded: maxMarks, max_marks: maxMarks, marks_breakdown: [], comment: '', page: 1,
      } }));
    } else if (tool === 'finding') {
      const parent = drawAnswerId
        || items.find(a => a.kind === 'answer' && a.box && containsCenter(a.box, box))?.id
        || null;
      dispatch(addItem({ pageKey, item: {
        id: uniqueId(items, `${parent || 'f'}-f`), kind: 'finding', answer_id: parent, box,
        category: 'minor_mistake', comment: '', marks_impact: 0, page: 1,
      } }));
    }
  }, [tool, items, drawAnswerId, maxMarks, pageKey, dispatch]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        dispatch(setTool('select'));
        dispatch(setSelectedId(null));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        dispatch(deleteItem({ pageKey, id: selectedId }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, pageKey, selectedId]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  useEffect(() => {
    if (!exportOpen) return undefined;
    const close = (e) => { if (!exportRef.current?.contains(e.target)) setExportOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [exportOpen]);

  // Replies that arrived while the pop-up was closed show as a dot on its launcher.
  const finishedTurns = chatTurns.filter(t => t.role === 'model' && t.status !== 'streaming').length;
  useEffect(() => { if (chatOpen) setSeenTurns(finishedTurns); }, [chatOpen, finishedTurns]);

  if (!page) return null;

  const basename = (activeSession?.metadata?.source_filename || activeSession?.title || 'evaluation').replace(/\.[^.]+$/, '');
  const drawingFor = tool === 'finding' && drawAnswerId
    ? items.find(i => i.id === drawAnswerId)?.question
    : null;

  const header = (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-800 truncate">{activeSession?.title || 'Evaluation'}</div>
        <div className="text-[11px] text-gray-400 truncate">
          {activeSession?.model_a?.display_name}
          {activeSession?.metadata?.reference_filename ? ` · key: ${activeSession.metadata.reference_filename}` : ' · no answer key'}
        </div>
      </div>
      <button
        onClick={() => dispatch(saveEvaluation())}
        disabled={!isDirty || saveStatus === 'saving'}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title={isDirty ? 'Save your edits' : 'No unsaved edits'}
      >
        <Save size={13} />
        {saveStatus === 'saving' ? 'Saving…' : isDirty ? 'Save' : saveStatus === 'error' ? 'Retry save' : 'Saved'}
      </button>
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen(o => !o)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600"
        >
          <Download size={13} /> Export
        </button>
        {exportOpen && (
          <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
            <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              onClick={() => { exportEvaluationCsv(activeSession, pages, annotations, basename); setExportOpen(false); }}>
              Marks sheet (.csv)
            </button>
            <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              onClick={() => { exportEvaluationJson(activeSession, pages, annotations, basename); setExportOpen(false); }}>
              Full evaluation (.json)
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="relative flex-1 min-w-0 overflow-hidden">
        <EvaluationCanvas
          page={page}
          items={items}
          selectedId={selectedId}
          tool={tool}
          zoom={zoom}
          showFindings={showFindings}
          findingNumbers={findingNumbers}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onCreate={onCreate}
        />

        {tool !== 'select' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-gray-900/85 text-white text-xs shadow">
            {tool === 'answer' ? 'Drag to draw an answer box' : `Drag to draw a finding box${drawingFor ? ` for ${drawingFor}` : ''}`} · Esc to cancel
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white shadow-lg border border-gray-200">
          <ToolButton active={tool === 'select'} onClick={() => dispatch(setTool('select'))} title="Select, move and resize boxes">
            <MousePointer2 size={14} /> Select
          </ToolButton>
          <ToolButton active={tool === 'answer'} onClick={() => dispatch(setTool('answer'))} title="Draw a box around a complete answer">
            <SquarePlus size={14} /> Answer
          </ToolButton>
          <ToolButton active={tool === 'finding'} onClick={() => dispatch(setTool({ tool: 'finding', answerId: null }))} title="Draw a box around a specific mistake or point">
            <SquareDashed size={14} /> Finding
          </ToolButton>
          <span className="w-px h-5 bg-gray-200 mx-1" />
          <ToolButton active={false} onClick={() => setShowFindings(v => !v)} title={showFindings ? 'Hide findings' : 'Show findings'}>
            {showFindings ? <Eye size={14} /> : <EyeOff size={14} />}
          </ToolButton>
          <span className="w-px h-5 bg-gray-200 mx-1" />
          <ToolButton active={false} onClick={() => dispatch(setZoom(zoom - 0.1))} title="Zoom out"><ZoomOut size={14} /></ToolButton>
          <button onClick={() => dispatch(setZoom(1))} className="w-12 text-xs text-gray-600 hover:text-gray-900" title="Fit width">
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton active={false} onClick={() => dispatch(setZoom(zoom + 0.1))} title="Zoom in"><ZoomIn size={14} /></ToolButton>
          {pages.length > 1 && (
            <>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              <ToolButton active={false} onClick={() => dispatch(setCurrentPageIndex(Math.max(0, currentPageIndex - 1)))} title="Previous page">
                <ChevronLeft size={14} />
              </ToolButton>
              <span className="text-xs text-gray-600 tabular-nums">{currentPageIndex + 1} / {pages.length}</span>
              <ToolButton active={false} onClick={() => dispatch(setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1)))} title="Next page">
                <ChevronRight size={14} />
              </ToolButton>
            </>
          )}
        </div>
      </div>

      <div className="relative w-[400px] xl:w-[440px] flex-shrink-0 border-l border-gray-200">
        <EvaluationPanel
          header={header}
          items={items}
          findingNumbers={findingNumbers}
          selectedId={selectedId}
          summary={summary}
          pageStatus={pageStatus[pageKey]}
          pageError={pageErrors[pageKey]}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddFinding={(answerId) => dispatch(setTool({ tool: 'finding', answerId }))}
          onAddAnswer={() => dispatch(setTool('answer'))}
          onReevaluate={(answerId) => {
            dispatch(setSelectedId(answerId));
            dispatch(setChatScope({ scope: 'answer', answerId }));
            dispatch(setChatOpen(true));
          }}
          bottomInset={chatOpen ? chatHeight : 48}
        />
        <EvaluationChatPopup
          items={items}
          open={chatOpen}
          busy={chatBusy}
          unread={finishedTurns > seenTurns}
          onOpen={() => dispatch(setChatOpen(true))}
          onClose={() => dispatch(setChatOpen(false))}
          onHeightChange={setChatHeight}
        />
      </div>
    </div>
  );
}
