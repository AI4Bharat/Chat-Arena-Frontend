import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, ArrowUp, Bot, LoaderCircle, LocateFixed, Undo2 } from 'lucide-react';
import { useReevaluation } from '../hooks/useReevaluation';
import {
  pageKeyOf, revertRevision, setChatScope, setCurrentPageIndex, setSelectedId,
} from '../store/evaluationSlice';
import { formatMarks } from '../utils/evaluationCategories';

const SUGGESTIONS = [
  'Be stricter: deduct a mark for missing or wrong units.',
  'Re-check the arithmetic in every step.',
  'Give method marks even when the final answer is wrong.',
  'Explain every deduction in more detail.',
];

function scopeLabel(turn, pageCount) {
  if (turn.scope === 'answer') return `${turn.question || 'Answer'}${pageCount > 1 ? ` · page ${turn.pageIndex + 1}` : ''}`;
  if (turn.scope === 'document') return turn.role === 'teacher' ? 'Whole document' : `Page ${turn.pageIndex + 1}`;
  return `Page ${turn.pageIndex + 1}`;
}

function ScoreChange({ before, after, scope }) {
  if (!before || !after) return null;
  const [b] = before;
  const [a, max] = after;
  const tone = a > b ? 'text-green-700 bg-green-50' : a < b ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-100';
  // A page revision can move marks between questions without changing the total.
  const prefix = scope === 'answer' ? '' : 'Page total ';
  const text = a === b
    ? `${prefix || 'Marks '}${prefix ? 'still ' : 'unchanged: '}${formatMarks(a)} / ${formatMarks(max)}`
    : `${prefix}${formatMarks(b)} → ${formatMarks(a)} / ${formatMarks(max)}`;
  return <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${tone}`}>{text}</span>;
}

function ModelTurn({ turn, modelName, pageCount, canUndo, onUndo, onShow }) {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} className="text-gray-500" />
      </div>
      <div className={`flex-1 min-w-0 rounded-xl border bg-white px-3 py-2 ${turn.status === 'reverted' ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
          <span className="font-medium text-gray-500 truncate">{modelName}</span>
          <span>·</span>
          <span className="whitespace-nowrap">{scopeLabel(turn, pageCount)}</span>
        </div>
        {turn.status === 'streaming' && (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 mb-1">
            <LoaderCircle size={12} className="animate-spin" />
            Re-evaluating{turn.progress ? ` · ${turn.progress} item${turn.progress === 1 ? '' : 's'} received` : '…'}
          </div>
        )}
        {turn.text && <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{turn.text}</p>}
        {turn.status === 'error' && (
          <div className="flex items-start gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span>{turn.error} The evaluation was not changed.</span>
          </div>
        )}
        {(turn.status === 'done' || turn.status === 'reverted') && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <ScoreChange before={turn.scoreBefore} after={turn.scoreAfter} scope={turn.scope} />
            <button onClick={onShow} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800">
              <LocateFixed size={11} /> Show
            </button>
            {turn.status === 'reverted' ? (
              <span className="text-[11px] text-gray-400">Undone</span>
            ) : canUndo && (
              <button onClick={onUndo} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600">
                <Undo2 size={11} /> Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Chat with the evaluator: the teacher describes what is wrong with the evaluation and
 * the model re-evaluates one answer, the current page or the whole document.
 */
export function EvaluationChat({ items }) {
  const dispatch = useDispatch();
  const { send } = useReevaluation();
  const { activeSession, pages, currentPageIndex, chatTurns, chatBusy, chatScope, selectedId } = useSelector(s => s.evaluation);
  const [draft, setDraft] = useState('');
  const [scope, setScope] = useState('page');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // The answer the "answer" scope would revise: preset from a card, else the current selection.
  const selectedAnswer = useMemo(() => {
    const pick = id => items.find(i => i.id === id);
    if (chatScope?.answerId) return pick(chatScope.answerId);
    const sel = pick(selectedId);
    return sel?.kind === 'finding' ? pick(sel.answer_id) : sel?.kind === 'answer' ? sel : null;
  }, [items, chatScope, selectedId]);

  useEffect(() => {
    if (chatScope?.scope) {
      setScope(chatScope.scope);
      inputRef.current?.focus();
    }
  }, [chatScope]);

  useEffect(() => {
    if (scope === 'answer' && !selectedAnswer) setScope('page');
  }, [scope, selectedAnswer]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatTurns]);

  // Only the newest applied revision of each page can be undone.
  const undoable = useMemo(() => {
    const latest = {};
    chatTurns.forEach(t => { if (t.role === 'model' && t.status === 'done') latest[t.messageId] = t.id; });
    return new Set(Object.values(latest));
  }, [chatTurns]);

  const submit = async () => {
    const prompt = draft.trim();
    if (!prompt || chatBusy) return;
    setDraft('');
    dispatch(setChatScope(null));
    await send({ prompt, scope, answerId: scope === 'answer' ? selectedAnswer?.id : undefined });
  };

  const undo = (turn) => {
    if (!window.confirm('Undo this re-evaluation? Edits made to this page since then are discarded too.')) return;
    dispatch(revertRevision({
      messageId: turn.messageId, revisionId: turn.revisionId, turnId: turn.id,
      pageKey: pageKeyOf(activeSession.id, turn.pageIndex),
    }));
  };

  const show = (turn) => {
    dispatch(setCurrentPageIndex(turn.pageIndex));
    if (turn.answerId) setTimeout(() => dispatch(setSelectedId(turn.answerId)), 0);
  };

  const scopes = [
    { key: 'answer', label: selectedAnswer ? `Answer ${selectedAnswer.question}` : 'Answer', disabled: !selectedAnswer,
      hint: 'Select an answer box first' },
    { key: 'page', label: pages.length > 1 ? `Page ${currentPageIndex + 1}` : 'This page' },
    ...(pages.length > 1 ? [{ key: 'document', label: `All ${pages.length} pages` }] : []),
  ];
  const modelName = activeSession?.model_a?.display_name || 'Evaluator';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatTurns.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-600 space-y-2">
            <p className="font-medium text-gray-800">Not happy with the evaluation?</p>
            <p>
              Tell the model what it got wrong and it will re-evaluate one answer, this page
              {pages.length > 1 ? ' or the whole document' : ''}, instead of you fixing every box and mark by hand.
              Your own edits on the page are sent along, and every re-evaluation can be undone.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setDraft(s); inputRef.current?.focus(); }}
                  className="px-2 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-[11px] text-gray-600">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatTurns.map(turn => (turn.role === 'teacher' ? (
          <div key={turn.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-xl bg-orange-50 border border-orange-100 px-3 py-2">
              <div className="text-[11px] font-medium text-orange-700 mb-0.5">{scopeLabel(turn, pages.length)}</div>
              <p className="text-xs leading-relaxed text-gray-800 whitespace-pre-wrap">{turn.text}</p>
            </div>
          </div>
        ) : (
          <ModelTurn
            key={turn.id}
            turn={turn}
            modelName={modelName}
            pageCount={pages.length}
            canUndo={undoable.has(turn.id) && !chatBusy}
            onUndo={() => undo(turn)}
            onShow={() => show(turn)}
          />
        )))}
      </div>

      <div className="border-t border-gray-200 bg-white p-3 space-y-2">
        <div className="flex items-center gap-1 flex-wrap" role="radiogroup" aria-label="What to re-evaluate">
          <span className="text-[11px] text-gray-400 mr-1">Re-evaluate</span>
          {scopes.map(s => (
            <button
              key={s.key}
              role="radio"
              aria-checked={scope === s.key}
              disabled={s.disabled}
              title={s.disabled ? s.hint : undefined}
              onClick={() => setScope(s.key)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors disabled:opacity-40 ${
                scope === s.key ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
          {/* Send sits on this row, clear of the bottom-right corner (dev builds float a devtools button there). */}
          <button
            onClick={submit}
            disabled={!draft.trim() || chatBusy}
            aria-label="Send feedback"
            className="ml-auto flex items-center gap-1 h-7 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs font-medium"
          >
            {chatBusy ? <LoaderCircle size={13} className="animate-spin" /> : <ArrowUp size={13} />}
            Send
          </button>
        </div>
        <textarea
          ref={inputRef}
          rows={3}
          value={draft}
          aria-label="Feedback for the model"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            e.stopPropagation();
          }}
          placeholder={scope === 'answer' && selectedAnswer
            ? `What should change in ${selectedAnswer.question}?`
            : 'e.g. Q2: perimeter is in cm, not sq cm, so take off a mark'}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <p className="text-[10px] text-gray-400">Enter to send · Shift+Enter for a new line</p>
      </div>
    </div>
  );
}
