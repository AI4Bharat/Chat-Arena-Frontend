import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  AlertCircle, LoaderCircle, MessageSquareText, Plus, RefreshCw, SquareDashedMousePointer, SquarePlus, Trash2,
} from 'lucide-react';
import { MarksInput } from './EvaluationCanvas';
import {
  breakdownTotal, categoryColor, EVAL_CATEGORY_OPTIONS, formatMarks, withAlpha,
} from '../utils/evaluationCategories';

function AutoTextarea({ value, onChange, placeholder, ariaLabel }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value || ''}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="w-full resize-none overflow-hidden rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs leading-relaxed text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
    />
  );
}

function CategorySelect({ value, onChange, ariaLabel }) {
  const color = categoryColor(value);
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="text-xs font-semibold rounded-full pl-2 pr-6 py-0.5 border cursor-pointer focus:outline-none"
      style={{ color, borderColor: color, background: withAlpha(color, 0.08) }}
    >
      {EVAL_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PageTag({ page, current }) {
  return (
    <span className={`text-[10px] font-medium px-1 rounded ${page === current ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
      p.{page}
    </span>
  );
}

function FindingRow({ finding, number, selected, pageNumber, onGoTo, onUpdate, onDelete, maxMarks }) {
  const color = categoryColor(finding.category);
  return (
    <div
      data-panel-id={finding.id}
      onClick={(e) => { e.stopPropagation(); onGoTo(finding.page, finding.id); }}
      className={`rounded-lg border p-2 space-y-1.5 cursor-pointer ${selected ? 'border-orange-300 bg-orange-50/60' : 'border-gray-100 bg-gray-50/60 hover:border-gray-200'}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: color }}>
          {number}
        </span>
        <CategorySelect value={finding.category} onChange={(category) => onUpdate(finding.id, { category })} ariaLabel={`Category of finding ${number}`} />
        {finding.page && <PageTag page={finding.page} current={pageNumber} />}
        {!finding.box && <span className="text-[10px] text-gray-400">no box</span>}
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-500" onClick={(e) => e.stopPropagation()}>
          <span>−</span>
          <MarksInput
            value={Math.abs(finding.marks_impact || 0)}
            max={maxMarks}
            onCommit={(v) => onUpdate(finding.id, { marks_impact: v ? -v : 0 })}
            className="w-8 rounded border border-gray-200 bg-white px-1 py-0.5 text-gray-700"
            ariaLabel={`Marks lost for finding ${number}`}
          />
          <button onClick={() => onDelete(finding.id)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete finding">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <AutoTextarea
        value={finding.comment}
        onChange={(comment) => onUpdate(finding.id, { comment })}
        placeholder="What is right or wrong here, and why?"
        ariaLabel={`Comment for finding ${number}`}
      />
    </div>
  );
}

function AnswerCard({
  answer, findings, findingNumbers, selectedId, selected, pageNumber,
  onSelect, onGoTo, onUpdate, onDelete, onAddFinding, onAddPart, onReevaluate,
}) {
  const color = categoryColor(answer.category);
  const breakdown = answer.marks_breakdown || [];
  const breakdownSum = breakdownTotal(breakdown);
  const mismatch = breakdown.length > 0 && Math.abs(breakdownSum - (answer.marks_awarded || 0)) > 0.01;
  const parts = answer.parts || [];

  const updateRow = (i, changes) => {
    const rows = breakdown.map((r, j) => (j === i ? { ...r, ...changes } : r));
    onUpdate(answer.id, { marks_breakdown: rows });
  };

  return (
    <div
      data-panel-id={answer.id}
      onClick={() => onSelect(answer.id)}
      className={`rounded-xl border bg-white shadow-sm cursor-pointer transition-shadow ${selected ? 'border-orange-300 ring-2 ring-orange-200' : 'border-gray-200 hover:shadow'}`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start gap-2 px-3 pt-3">
        <input
          value={answer.question || ''}
          aria-label="Question label"
          title="Question label — shared by all of this answer's boxes"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate(answer.id, { question: e.target.value })}
          className="w-14 text-sm font-bold text-gray-800 bg-transparent rounded px-1 -ml-1 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <p className="flex-1 min-w-0 pt-0.5 text-xs text-gray-500 line-clamp-2">{answer.question_text}</p>
        <div
          className="flex items-center gap-0.5 rounded-lg border-2 px-1.5 py-0.5 text-base"
          style={{ borderColor: color, color }}
          onClick={(e) => e.stopPropagation()}
        >
          <MarksInput
            value={answer.marks_awarded}
            max={answer.max_marks}
            onCommit={(v) => onUpdate(answer.id, { marks_awarded: v })}
            className="w-9"
            ariaLabel={`Marks for ${answer.question}`}
          />
          <span className="text-sm text-gray-500 font-medium">/ {formatMarks(answer.max_marks)}</span>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <CategorySelect value={answer.category} onChange={(category) => onUpdate(answer.id, { category })} ariaLabel={`Category of ${answer.question}`} />
          <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()} data-testid={`boxes-${answer.id}`}>
            <span className="text-[11px] text-gray-400">{parts.length === 1 ? 'Box' : `${parts.length} boxes`}</span>
            {parts.map((part, i) => (
              <button
                key={part.id}
                onClick={() => onGoTo(part.page, part.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  part.id === selectedId ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : part.page === pageNumber ? 'border-orange-200 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
                title={parts.length > 1 ? `Part ${i + 1} of ${parts.length}, on page ${part.page}` : `On page ${part.page}`}
              >
                p.{part.page}
              </button>
            ))}
            {parts.length === 0 && <span className="text-[10px] text-gray-400">none drawn</span>}
            <button
              onClick={() => onAddPart(answer.id)}
              className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600 hover:text-orange-700 ml-1"
              title="Draw another box for this answer on this page, e.g. where it continues"
            >
              <SquarePlus size={11} /> Box on p.{pageNumber}
            </button>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1">Overall comment</div>
          <AutoTextarea
            value={answer.comment}
            onChange={(comment) => onUpdate(answer.id, { comment })}
            placeholder="Why does this answer get these marks?"
            ariaLabel={`Overall comment for ${answer.question}`}
          />
        </div>

        {breakdown.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1">Marks distribution</div>
            <div className="rounded-md border border-gray-100 divide-y divide-gray-100">
              {breakdown.map((row, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1">
                  <input
                    value={row.criterion}
                    aria-label="Criterion"
                    onChange={(e) => updateRow(i, { criterion: e.target.value })}
                    className="flex-1 min-w-0 text-xs text-gray-700 bg-transparent focus:outline-none"
                  />
                  <MarksInput
                    value={row.awarded}
                    max={row.max}
                    onCommit={(v) => updateRow(i, { awarded: v })}
                    className="w-8 rounded border border-gray-200 px-1 py-0.5 text-xs text-gray-800"
                    ariaLabel={`${row.criterion} marks`}
                  />
                  <span className="text-xs text-gray-400 w-8">/ {formatMarks(row.max)}</span>
                </div>
              ))}
            </div>
            {mismatch && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700">
                <AlertCircle size={12} />
                Distribution adds up to {formatMarks(breakdownSum)}.
                <button className="underline" onClick={() => onUpdate(answer.id, { marks_awarded: breakdownSum })}>Use it</button>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Findings ({findings.length})</span>
            <button
              onClick={(e) => { e.stopPropagation(); onAddFinding(answer.id); }}
              className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
            >
              <SquareDashedMousePointer size={12} /> Draw finding
            </button>
          </div>
          <div className="space-y-1.5">
            {findings.map(f => (
              <FindingRow
                key={f.id} finding={f} number={findingNumbers[f.id]} selected={f.id === selectedId} pageNumber={pageNumber}
                onGoTo={onGoTo} onUpdate={onUpdate} onDelete={onDelete} maxMarks={answer.max_marks}
              />
            ))}
            {findings.length === 0 && <p className="text-[11px] text-gray-400">No specific findings.</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); onReevaluate(answer.id); }}
            className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
            title="Tell the model what to change and let it re-evaluate this answer"
          >
            <MessageSquareText size={12} /> Re-evaluate with feedback
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(answer.id); }}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500"
          >
            <Trash2 size={12} /> Delete answer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Right-hand panel: score summary and one editable card per question. A question's card
 * covers all of its boxes, whichever pages they are on; the list shows the questions with a
 * box on the current page, or every question.
 */
export function EvaluationPanel({
  items, findingNumbers, selectedId, selectedAnswerId, summary, pageNumber, pageCount, pageFilter, onPageFilter,
  evalStatus, evalError, onRetry, onSelect, onGoTo, onUpdate, onDelete, onAddFinding, onAddPart, onAddAnswer,
  onReevaluate, header, bottomInset = 0,
}) {
  const listRef = useRef(null);
  const answers = items.filter(i => i.kind === 'answer');
  const onThisPage = (a) => (a.parts || []).some(p => p.page === pageNumber)
    || items.some(f => f.kind === 'finding' && f.answer_id === a.id && f.page === pageNumber);
  const pageAnswers = answers.filter(onThisPage);
  const shown = pageFilter === 'all' ? answers : pageAnswers;
  const answerIds = new Set(answers.map(a => a.id));
  const orphans = items.filter(i => i.kind === 'finding' && !answerIds.has(i.answer_id)
    && (pageFilter === 'all' || i.page === pageNumber));

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-panel-id="${CSS.escape(selectedId)}"]`)
      || (selectedAnswerId && listRef.current.querySelector(`[data-panel-id="${CSS.escape(selectedAnswerId)}"]`));
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, selectedAnswerId]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 py-3 border-b border-gray-200 bg-white space-y-3">
        {header}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Total score</div>
            <div className="text-2xl font-bold text-gray-800" data-testid="eval-total">
              {formatMarks(summary.awarded)} <span className="text-base font-medium text-gray-400">/ {formatMarks(summary.max)}</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{summary.answers} question{summary.answers === 1 ? '' : 's'} · {summary.pages} page{summary.pages === 1 ? '' : 's'}</div>
            {summary.max > 0 && <div className="font-semibold text-gray-700">{Math.round((summary.awarded / summary.max) * 100)}%</div>}
          </div>
        </div>
      </div>

      {/* While the chat pop-up covers the bottom, keep every card reachable and scroll targets above it. */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ paddingBottom: bottomInset + 12, scrollPaddingBottom: bottomInset + 12 }}
      >
        <div className="flex items-center justify-between gap-2">
          {pageCount > 1 ? (
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-gray-200/70 text-[11px] font-medium" role="radiogroup" aria-label="Questions shown">
              {[['page', `Page ${pageNumber} (${pageAnswers.length})`], ['all', `All pages (${answers.length})`]].map(([key, label]) => (
                <button
                  key={key}
                  role="radio"
                  aria-checked={pageFilter === key}
                  onClick={() => onPageFilter(key)}
                  className={`px-2 py-1 rounded-md ${pageFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : <span />}
          {evalStatus === 'streaming' && (
            <span className="flex items-center gap-1 text-xs text-orange-600"><LoaderCircle size={12} className="animate-spin" /> Evaluating the sheet…</span>
          )}
        </div>

        {evalStatus === 'error' && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1">{evalError || 'The model could not evaluate this sheet.'}</span>
            {onRetry && (
              <button onClick={onRetry} className="flex items-center gap-1 font-medium underline whitespace-nowrap">
                <RefreshCw size={11} /> Run again
              </button>
            )}
          </div>
        )}

        {shown.map(answer => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            findings={items.filter(i => i.kind === 'finding' && i.answer_id === answer.id)}
            findingNumbers={findingNumbers}
            selectedId={selectedId}
            selected={answer.id === selectedAnswerId}
            pageNumber={pageNumber}
            onSelect={onSelect}
            onGoTo={onGoTo}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddFinding={onAddFinding}
            onAddPart={onAddPart}
            onReevaluate={onReevaluate}
          />
        ))}

        {orphans.length > 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 space-y-1.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Findings not linked to an answer</div>
            {orphans.map(f => (
              <FindingRow key={f.id} finding={f} number={findingNumbers[f.id]} selected={f.id === selectedId} pageNumber={pageNumber}
                onGoTo={onGoTo} onUpdate={onUpdate} onDelete={onDelete} maxMarks={summary.maxPerQuestion} />
            ))}
          </div>
        )}

        {shown.length === 0 && evalStatus !== 'streaming' && (
          <p className="px-1 py-6 text-center text-xs text-gray-400">
            {pageFilter === 'all' ? 'No answers found.' : `No answers on page ${pageNumber}.`}
          </p>
        )}

        <button
          onClick={onAddAnswer}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 bg-white"
        >
          <Plus size={13} /> Draw a new answer box
        </button>
      </div>
    </div>
  );
}
