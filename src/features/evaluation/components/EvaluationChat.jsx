import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertCircle, ArrowUp, Bot, LoaderCircle, LocateFixed, Maximize2, MessageSquareText, Minimize2, Undo2, X,
} from 'lucide-react';
import { useReevaluation } from '../hooks/useReevaluation';
import {
  answerPages, revertRevision, selectedAnswerOf, setChatScope, setCurrentPageIndex, setSelectedId,
} from '../store/evaluationSlice';
import { formatMarks } from '../utils/evaluationCategories';

const SUGGESTIONS = [
  'Be stricter: deduct a mark for missing or wrong units.',
  'Re-check the arithmetic in every step.',
  'Give method marks even when the final answer is wrong.',
  'Explain every deduction in more detail.',
];

function scopeLabel(turn, pageCount) {
  if (turn.scope === 'answer') return turn.question || 'Answer';
  if (turn.scope === 'page') return `Page ${turn.page}`;
  return pageCount > 1 ? 'Whole sheet' : 'This page';
}

function ScoreChange({ before, after, scope }) {
  if (!before || !after) return null;
  const [b] = before;
  const [a, max] = after;
  const tone = a > b ? 'text-green-700 bg-green-50' : a < b ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-100';
  // A page or sheet revision can move marks between questions without changing the total.
  const prefix = { answer: '', page: 'Page total ' }[scope] ?? 'Total ';
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
            Re-evaluating{turn.progress ? ` · ${turn.progress} item${turn.progress === 1 ? '' : 's'} received` : `… ${turn.note || ''}`}
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
export function EvaluationChat({ items, onEscape }) {
  const dispatch = useDispatch();
  const { send } = useReevaluation();
  const { activeSession, pages, currentPageIndex, chatTurns, chatBusy, chatScope, selectedId } = useSelector(s => s.evaluation);
  const [draft, setDraft] = useState('');
  const [scope, setScope] = useState('document');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // The answer the "answer" scope would revise: preset from a card, else the current selection.
  const selectedAnswer = useMemo(() => {
    if (chatScope?.answerId) return items.find(i => i.kind === 'answer' && i.id === chatScope.answerId) || null;
    return selectedAnswerOf(items, selectedId); // an answer, one of its boxes, or one of its findings
  }, [items, chatScope, selectedId]);

  useEffect(() => {
    if (chatScope?.scope) {
      setScope(chatScope.scope);
      inputRef.current?.focus();
    }
  }, [chatScope]);

  useEffect(() => {
    if (scope === 'answer' && !selectedAnswer) setScope('document');
  }, [scope, selectedAnswer]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatTurns]);

  // Only the newest applied revision can be undone (then the one before it, and so on).
  const undoable = useMemo(
    () => [...chatTurns].reverse().find(t => t.role === 'model' && t.status === 'done')?.id,
    [chatTurns],
  );

  const submit = async () => {
    const prompt = draft.trim();
    if (!prompt || chatBusy) return;
    setDraft('');
    dispatch(setChatScope(null));
    await send({ prompt, scope, answerId: scope === 'answer' ? selectedAnswer?.id : undefined });
  };

  const undo = (turn) => {
    if (!window.confirm('Undo this re-evaluation? Edits made to the sheet since then are discarded too.')) return;
    dispatch(revertRevision({ messageId: turn.messageId, revisionId: turn.revisionId, turnId: turn.id }));
  };

  const show = (turn) => {
    const answer = turn.answerId && items.find(i => i.id === turn.answerId);
    const page = answer ? answerPages(answer)[0] : turn.page;
    if (page && page - 1 !== currentPageIndex) dispatch(setCurrentPageIndex(page - 1));
    if (answer) setTimeout(() => dispatch(setSelectedId(answer.id)), 0);
  };

  const selectedPages = selectedAnswer ? answerPages(selectedAnswer) : [];
  const scopes = [
    { key: 'answer', disabled: !selectedAnswer, hint: 'Select an answer box first',
      label: selectedAnswer
        ? `Answer ${selectedAnswer.question}${selectedPages.length > 1 ? ` (pages ${selectedPages.join(', ')})` : ''}`
        : 'Answer' },
    ...(pages.length > 1
      ? [{ key: 'page', label: `Page ${currentPageIndex + 1}` }, { key: 'document', label: 'Whole sheet' }]
      : [{ key: 'document', label: 'This page' }]),
  ];
  const modelName = activeSession?.model_a?.display_name || 'Evaluator';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatTurns.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-600 space-y-2">
            <p className="font-medium text-gray-800">Not happy with the evaluation?</p>
            <p>
              Tell the model what it got wrong and it will re-evaluate one answer (across all its pages)
              {pages.length > 1 ? ', one page or the whole sheet' : ' or the whole page'}, instead of you fixing every box and mark by hand.
              Your own edits are sent along, and every re-evaluation can be undone.
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
            canUndo={undoable === turn.id && !chatBusy}
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
            if (e.key === 'Escape') onEscape?.();
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

/**
 * The chat as a pop-up over the lower part of the side panel, so the answer cards stay
 * in view. Closing it keeps the transcript; a running re-evaluation carries on.
 */
export function EvaluationChatPopup({ items, open, busy, unread, onOpen, onClose, onHeightChange }) {
  const modelName = useSelector(s => s.evaluation.activeSession?.model_a?.display_name) || 'the model';
  const [expanded, setExpanded] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!open || !el) {
      onHeightChange(0);
      return undefined;
    }
    const ro = new ResizeObserver(() => onHeightChange(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, expanded, onHeightChange]);

  if (!open) {
    return (
      <button
        onClick={onOpen}
        className="absolute left-3 bottom-3 z-40 flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium shadow-lg"
      >
        <MessageSquareText size={16} />
        Chat with model
        {busy ? <LoaderCircle size={14} className="animate-spin" />
          : unread ? <span className="w-2 h-2 rounded-full bg-white" aria-label="New reply" /> : null}
      </button>
    );
  }

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label="Chat with model"
      className={`absolute left-3 right-3 bottom-3 z-40 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden ${
        expanded ? 'top-3' : 'h-[58%] min-h-[360px]'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <MessageSquareText size={16} className="text-orange-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800">Chat with model</div>
          <div className="text-[11px] text-gray-400 truncate">Tell {modelName} what to fix and it re-evaluates</div>
        </div>
        {busy && <LoaderCircle size={14} className="animate-spin text-orange-500" />}
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200"
          title={expanded ? 'Shrink' : 'Expand to the full panel'}
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button onClick={onClose} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200" title="Close chat" aria-label="Close chat">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 min-h-0 bg-gray-50">
        <EvaluationChat items={items} onEscape={onClose} />
      </div>
    </div>
  );
}
