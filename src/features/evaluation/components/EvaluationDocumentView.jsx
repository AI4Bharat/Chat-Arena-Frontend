import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronLeft, ChevronRight, Download, Eye, EyeOff, MousePointer2, Save, SquareDashed, SquarePlus, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useEvaluationJob } from '../hooks/useEvaluationJob';
import { EvaluationCanvas } from './EvaluationCanvas';
import { EvaluationPanel } from './EvaluationPanel';
import { EvaluationChatPopup } from './EvaluationChat';
import {
  addItem, addPart, deleteItem, movePart, nextId, pageNumberOf, resolveSelection, saveEvaluation, selectMaxMarks,
  selectedAnswerOf, setChatOpen, setChatScope, setCurrentPageIndex, setPageFilter, setSelectedId, setTool, setZoom,
  updateItem, updatePart,
} from '../store/evaluationSlice';
import { exportEvaluationCsv, exportEvaluationJson } from '../utils/evaluationExport';

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
    activeSession, pages, currentPageIndex, items, evalStatus, evalError, pageFilter,
    selectedId, tool, drawAnswerId, zoom, dirty: isDirty, saveStatus, chatOpen, chatBusy, chatTurns,
  } = useSelector(s => s.evaluation);
  const { run } = useEvaluationJob();
  const maxMarks = useSelector(selectMaxMarks);
  const [showFindings, setShowFindings] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatHeight, setChatHeight] = useState(0);
  const [seenTurns, setSeenTurns] = useState(chatTurns.length);
  const exportRef = useRef(null);

  const page = pages[currentPageIndex];
  const pageNumber = pageNumberOf(currentPageIndex);
  const selectedAnswer = useMemo(() => selectedAnswerOf(items, selectedId), [items, selectedId]);

  // Findings are numbered across the sheet, grouped under their answers in answer order.
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

  // Each question counts once, however many boxes (and pages) its answer has.
  const summary = useMemo(() => {
    const answers = items.filter(a => a.kind === 'answer');
    return {
      awarded: answers.reduce((s, a) => s + (Number(a.marks_awarded) || 0), 0),
      max: answers.reduce((s, a) => s + (Number(a.max_marks) || 0), 0),
      answers: answers.length,
      pages: pages.length,
      maxPerQuestion: maxMarks,
    };
  }, [items, pages.length, maxMarks]);

  const onSelect = useCallback((id) => dispatch(setSelectedId(id)), [dispatch]);
  const onUpdate = useCallback((id, changes) => dispatch(updateItem({ id, changes })), [dispatch]);
  const onDelete = useCallback((id) => dispatch(deleteItem(id)), [dispatch]);
  const onUpdateBox = useCallback((id, box) => {
    if (resolveSelection(items, id).part) dispatch(updatePart({ partId: id, changes: { box } }));
    else dispatch(updateItem({ id, changes: { box } }));
  }, [dispatch, items]);
  const onGoTo = useCallback((pageNo, id) => {
    if (pageNo && pageNo - 1 !== currentPageIndex) dispatch(setCurrentPageIndex(pageNo - 1));
    dispatch(setSelectedId(id));
  }, [dispatch, currentPageIndex]);

  const onCreate = useCallback((box) => {
    if (tool === 'answer') {
      const id = nextId(items, 'q');
      dispatch(addItem({
        id, kind: 'answer', question: `Q${id.slice(1)}`, question_text: '', parts: [{ id: `${id}-p1`, page: pageNumber, box }],
        category: 'correct', marks_awarded: maxMarks, max_marks: maxMarks, marks_breakdown: [], comment: '',
      }));
    } else if (tool === 'part' && drawAnswerId) {
      dispatch(addPart({ answerId: drawAnswerId, page: pageNumber, box }));
    } else if (tool === 'finding') {
      const parent = drawAnswerId
        || items.find(a => a.kind === 'answer' && (a.parts || []).some(p => p.page === pageNumber && containsCenter(p.box, box)))?.id
        || null;
      dispatch(addItem({
        id: nextId(items, `${parent || 'f'}-f`), kind: 'finding', answer_id: parent, page: pageNumber, box,
        category: 'minor_mistake', comment: '', marks_impact: 0,
      }));
    }
  }, [tool, items, drawAnswerId, maxMarks, pageNumber, dispatch]);

  const onMovePart = useCallback((partId, toAnswerId) => {
    const { answer } = resolveSelection(items, partId);
    const target = items.find(i => i.id === toAnswerId);
    if (answer?.parts.length === 1 && !window.confirm(
      `${answer.question} has no other box, so it will be merged into ${target ? target.question : 'the new question'}: `
      + 'its findings move over and its own marks and comment are dropped. Continue?',
    )) return;
    dispatch(movePart({ partId, toAnswerId }));
  }, [dispatch, items]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        dispatch(setTool('select'));
        dispatch(setSelectedId(null));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        dispatch(deleteItem(selectedId));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, selectedId]);

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
  const drawingFor = (tool === 'finding' || tool === 'part') && drawAnswerId
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
              onClick={() => { exportEvaluationCsv(activeSession, pages, items, basename); setExportOpen(false); }}>
              Marks sheet (.csv)
            </button>
            <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              onClick={() => { exportEvaluationJson(activeSession, pages, items, basename); setExportOpen(false); }}>
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
          pageNumber={pageNumber}
          items={items}
          selectedId={selectedId}
          tool={tool}
          zoom={zoom}
          showFindings={showFindings}
          findingNumbers={findingNumbers}
          onSelect={onSelect}
          onUpdateBox={onUpdateBox}
          onUpdateAnswer={onUpdate}
          onCreate={onCreate}
          onMovePart={onMovePart}
          onDeletePart={onDelete}
        />

        {tool !== 'select' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-gray-900/85 text-white text-xs shadow">
            {tool === 'answer' && 'Drag to draw a box around a new answer'}
            {tool === 'part' && `Drag to draw another box for ${drawingFor || 'the answer'} on page ${pageNumber}`}
            {tool === 'finding' && `Drag to draw a finding box${drawingFor ? ` for ${drawingFor}` : ''}`}
            {' · Esc to cancel'}
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white shadow-lg border border-gray-200 whitespace-nowrap">
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
              <span className="text-xs text-gray-600 tabular-nums" aria-label="Page">{currentPageIndex + 1} / {pages.length}</span>
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
          selectedAnswerId={selectedAnswer?.id}
          summary={summary}
          pageNumber={pageNumber}
          pageCount={pages.length}
          pageFilter={pageFilter}
          onPageFilter={(f) => dispatch(setPageFilter(f))}
          evalStatus={evalStatus}
          evalError={evalError}
          onRetry={evalStatus === 'error' ? () => run(sessionId) : null}
          onSelect={onSelect}
          onGoTo={onGoTo}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddFinding={(answerId) => dispatch(setTool({ tool: 'finding', answerId }))}
          onAddPart={(answerId) => dispatch(setTool({ tool: 'part', answerId }))}
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
