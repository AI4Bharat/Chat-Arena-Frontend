import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { categoryColor, categoryLabel, clampMarks, formatMarks, withAlpha } from '../utils/evaluationCategories';

const MIN_BOX = 8; // natural px
const HANDLES = ['nw', 'ne', 'sw', 'se'];

function pct(box, w, h) {
  const [x1, y1, x2, y2] = box;
  return {
    left: `${(x1 / w) * 100}%`,
    top: `${(y1 / h) * 100}%`,
    width: `${((x2 - x1) / w) * 100}%`,
    height: `${((y2 - y1) / h) * 100}%`,
  };
}

function normalizeBox(x1, y1, x2, y2, w, h) {
  const clampX = v => Math.max(0, Math.min(w, Math.round(v)));
  const clampY = v => Math.max(0, Math.min(h, Math.round(v)));
  return [clampX(Math.min(x1, x2)), clampY(Math.min(y1, y2)), clampX(Math.max(x1, x2)), clampY(Math.max(y1, y2))];
}

/** Numeric marks box that edits as free text and commits a clamped value on blur / Enter. */
export function MarksInput({ value, max, onCommit, className = '', ariaLabel }) {
  const [draft, setDraft] = useState(value ?? '');
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(value ?? ''); }, [value]);

  const commit = () => {
    const next = clampMarks(draft, 0, max);
    setDraft(next ?? '');
    if (next !== value) onCommit(next ?? 0);
  };

  return (
    <input
      type="number" inputMode="decimal" min={0} max={max} step={0.5}
      aria-label={ariaLabel}
      value={draft}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; commit(); }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); e.stopPropagation(); }}
      className={`[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-right font-bold bg-transparent focus:outline-none ${className}`}
    />
  );
}

/**
 * EvaluationCanvas — one answer-sheet page with answer and finding boxes on top.
 *
 * Boxes are HTML overlays positioned in % of the page's natural size, so zoom is a
 * plain width change. An answer can own several boxes ("parts") across pages; each box
 * here carries the question tag ("part 1 of 2"), the answer's editable marks, and when
 * selected a control to re-label it to another question. Finding boxes are dashed,
 * numbered, and show their comment when selected.
 */
export function EvaluationCanvas({
  page, pageNumber, items, selectedId, tool, zoom, showFindings, findingNumbers,
  onSelect, onUpdateBox, onUpdateAnswer, onCreate, onMovePart, onDeletePart,
}) {
  const scrollRef = useRef(null);
  const stageRef = useRef(null);
  const [natural, setNatural] = useState({ w: page.width || 0, h: page.height || 0 });
  const [fitWidth, setFitWidth] = useState(800);
  const [live, setLive] = useState(null); // { id?, box } while dragging / drawing
  const gesture = useRef(null);

  useEffect(() => { setNatural({ w: page.width || 0, h: page.height || 0 }); }, [page.url, page.width, page.height]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => setFitWidth(Math.max(320, el.clientWidth - 64));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedId || !stageRef.current) return;
    const id = CSS.escape(selectedId);
    const el = stageRef.current.querySelector(`[data-box-id="${id}"], [data-answer-id="${id}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const toNatural = useCallback((e) => {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * natural.w,
      y: ((e.clientY - rect.top) / rect.height) * natural.h,
    };
  }, [natural]);

  const startGesture = (e, g) => {
    e.preventDefault();
    e.stopPropagation();
    gesture.current = { ...g, start: toNatural(e) };
    setLive(g.box ? { id: g.id, box: g.box } : null);

    const onMove = (ev) => {
      const gs = gesture.current;
      if (!gs) return;
      const p = toNatural(ev);
      const dx = p.x - gs.start.x;
      const dy = p.y - gs.start.y;
      let next;
      if (gs.mode === 'draw') {
        next = normalizeBox(gs.start.x, gs.start.y, p.x, p.y, natural.w, natural.h);
      } else if (gs.mode === 'move') {
        const [x1, y1, x2, y2] = gs.box;
        const bw = x2 - x1;
        const bh = y2 - y1;
        const nx = Math.max(0, Math.min(natural.w - bw, x1 + dx));
        const ny = Math.max(0, Math.min(natural.h - bh, y1 + dy));
        next = [Math.round(nx), Math.round(ny), Math.round(nx + bw), Math.round(ny + bh)];
      } else {
        let [x1, y1, x2, y2] = gs.box;
        if (gs.handle.includes('w')) x1 += dx; else x2 += dx;
        if (gs.handle.includes('n')) y1 += dy; else y2 += dy;
        next = normalizeBox(x1, y1, x2, y2, natural.w, natural.h);
      }
      gs.moved = gs.moved || Math.abs(dx) > 2 || Math.abs(dy) > 2;
      gs.current = next;
      setLive({ id: gs.id, box: next });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const gs = gesture.current;
      gesture.current = null;
      setLive(null);
      if (!gs?.current || !gs.moved) return;
      const [x1, y1, x2, y2] = gs.current;
      if (x2 - x1 < MIN_BOX || y2 - y1 < MIN_BOX) return;
      if (gs.mode === 'draw') onCreate(gs.current);
      else onUpdateBox(gs.id, gs.current);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onStagePointerDown = (e) => {
    if (e.button !== 0) return;
    if (tool === 'select') {
      onSelect(null);
      return;
    }
    startGesture(e, { mode: 'draw' });
  };

  const onBoxPointerDown = (e, item) => {
    if (e.button !== 0) return;
    if (tool !== 'select') return; // let drawing start on top of existing boxes
    e.stopPropagation();
    onSelect(item.id);
    startGesture(e, { mode: 'move', id: item.id, box: item.box });
  };

  const boxOf = (item) => (live && live.id === item.id ? live.box : item.box);
  const ready = natural.w > 0 && natural.h > 0;
  const answers = items.filter(i => i.kind === 'answer');
  // An answer can have several boxes ("parts"), on this page or others: draw the ones here.
  const partBoxes = answers.flatMap(answer => (answer.parts || [])
    .map((part, index) => ({ answer, part, index, count: answer.parts.length }))
    .filter(({ part }) => part.page === pageNumber && part.box));
  const findings = showFindings ? items.filter(i => i.kind === 'finding' && i.box && i.page === pageNumber) : [];

  const renderHandles = (item, color) => HANDLES.map(handle => (
    <span
      key={handle}
      onPointerDown={(e) => startGesture(e, { mode: 'resize', id: item.id, box: item.box, handle })}
      className="absolute w-2.5 h-2.5 bg-white border-2 rounded-sm"
      style={{
        borderColor: color,
        cursor: `${handle}-resize`,
        left: handle.includes('w') ? -6 : undefined,
        right: handle.includes('e') ? -6 : undefined,
        top: handle.includes('n') ? -6 : undefined,
        bottom: handle.includes('s') ? -6 : undefined,
      }}
    />
  ));

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-auto bg-gray-100">
      <div className="min-w-full flex justify-center px-8 pt-10 pb-24">
        <div
          ref={stageRef}
          onPointerDown={onStagePointerDown}
          className="relative shadow-md bg-white select-none flex-shrink-0"
          style={{
            width: fitWidth * zoom,
            aspectRatio: ready ? `${natural.w} / ${natural.h}` : undefined,
            cursor: tool === 'select' ? 'default' : 'crosshair',
            touchAction: 'none',
          }}
        >
          <img
            src={page.url}
            alt="Answer sheet page"
            draggable={false}
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (!page.width || !page.height) setNatural({ w, h });
            }}
            className="block w-full h-auto pointer-events-none"
          />

          {ready && partBoxes.map(({ answer, part, index, count }) => {
            const color = categoryColor(answer.category);
            const selected = part.id === selectedId;
            const highlighted = selected || answer.id === selectedId; // the card selects all its boxes
            const otherPages = [...new Set(answer.parts.map(p => p.page))].filter(n => n !== pageNumber);
            return (
              <div
                key={part.id}
                data-box-id={part.id}
                data-answer-id={answer.id}
                onPointerDown={(e) => onBoxPointerDown(e, part)}
                className="absolute rounded-sm"
                style={{
                  ...pct(boxOf(part), natural.w, natural.h),
                  border: `${highlighted ? 3 : 2}px solid ${color}`,
                  background: withAlpha(color, highlighted ? 0.08 : 0.04),
                  boxShadow: highlighted ? `0 0 0 3px ${withAlpha(color, 0.25)}` : undefined,
                  cursor: tool === 'select' ? 'move' : 'crosshair',
                  zIndex: selected ? 20 : 10,
                }}
              >
                <div
                  className="absolute -top-6 -left-0.5 flex items-center gap-1 px-1.5 h-5 rounded-t text-[11px] font-semibold text-white whitespace-nowrap"
                  style={{ background: color }}
                >
                  {answer.question} · {categoryLabel(answer.category)}
                  {count > 1 && <span className="font-normal opacity-90">· part {index + 1} of {count}</span>}
                </div>
                <div
                  className="absolute -top-8 -right-0.5 flex items-center gap-0.5 pl-1 pr-1.5 h-7 rounded-md bg-white shadow border-2 text-sm"
                  style={{ borderColor: color, color }}
                  onPointerDown={(e) => { e.stopPropagation(); onSelect(part.id); }}
                  title={count > 1 ? `Marks for the whole of ${answer.question} (all ${count} boxes)` : 'Marks for this answer'}
                >
                  <MarksInput
                    value={answer.marks_awarded}
                    max={answer.max_marks}
                    onCommit={(v) => onUpdateAnswer(answer.id, { marks_awarded: v })}
                    className="w-9"
                    ariaLabel={`Marks for ${answer.question}`}
                  />
                  <span className="text-gray-500 font-medium">/ {formatMarks(answer.max_marks)}</span>
                </div>
                {selected && tool === 'select' && renderHandles(part, color)}
                {selected && !live && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-2 w-72 rounded-lg bg-white shadow-lg border border-gray-200 p-3 text-left cursor-default space-y-2"
                    style={{ zIndex: 50 }}
                  >
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="whitespace-nowrap">Box belongs to</span>
                      <select
                        aria-label="Question this box belongs to"
                        value={answer.id}
                        onChange={(e) => onMovePart(part.id, e.target.value === '__new__' ? null : e.target.value)}
                        className="flex-1 min-w-0 rounded border border-gray-200 px-1.5 py-1 text-xs font-medium text-gray-800"
                      >
                        {answers.map(a => <option key={a.id} value={a.id}>{a.question}</option>)}
                        <option value="__new__">New question…</option>
                      </select>
                    </label>
                    <p className="text-[11px] text-gray-500">
                      {otherPages.length
                        ? `${answer.question} also has ${otherPages.length === 1 ? 'a box' : 'boxes'} on page ${otherPages.join(', ')}. Marks and comments cover all of them.`
                        : `Pick another question to join this box to it, e.g. when an answer continues from the previous page.`}
                    </p>
                    {count > 1 && (
                      <button onClick={() => onDeletePart(part.id)} className="text-[11px] text-gray-500 hover:text-red-600">
                        Remove this box
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {ready && findings.map(item => {
            const color = categoryColor(item.category);
            const selected = item.id === selectedId;
            const box = boxOf(item);
            return (
              <div
                key={item.id}
                data-box-id={item.id}
                onPointerDown={(e) => onBoxPointerDown(e, item)}
                title={item.comment}
                className="absolute rounded"
                style={{
                  ...pct(box, natural.w, natural.h),
                  border: `2px dashed ${color}`,
                  background: withAlpha(color, selected ? 0.18 : 0.1),
                  cursor: tool === 'select' ? 'move' : 'crosshair',
                  zIndex: selected ? 40 : 30,
                }}
              >
                <span
                  className="absolute top-1/2 -translate-y-1/2 -left-6 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow"
                  style={{ background: color }}
                >
                  {findingNumbers[item.id] ?? '•'}
                </span>
                {selected && tool === 'select' && renderHandles(item, color)}
                {selected && !live && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-2 w-72 rounded-lg bg-white shadow-lg border border-gray-200 p-3 text-left cursor-default"
                    style={{ zIndex: 50 }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color }}>{categoryLabel(item.category)}</span>
                      {item.marks_impact ? (
                        <span className="text-xs font-semibold text-red-600">{formatMarks(item.marks_impact)} marks</span>
                      ) : null}
                    </div>
                    <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {item.comment || <span className="italic text-gray-400">No comment yet — add one in the panel.</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {live && !live.id && (
            <div
              className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10 pointer-events-none"
              style={{ ...pct(live.box, natural.w, natural.h), zIndex: 60 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
