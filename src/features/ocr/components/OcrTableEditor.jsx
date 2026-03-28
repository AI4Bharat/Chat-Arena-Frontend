import { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut, Undo2, Redo2, Save, Columns2, Rows2, ClipboardCopy, Check, Info } from 'lucide-react';
import { parseTableData, serializeTable, normalizeRows } from '../utils/tableUtils';

function CroppedImage({ imageUrl, box, zoom }) {
  const [naturalW, setNaturalW] = useState(null);
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setNaturalW(img.naturalWidth);
    img.src = imageUrl;
  }, [imageUrl]);
  if (!imageUrl || !box) return <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No image</div>;
  if (!naturalW)         return <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Loading…</div>;
  const [x1, y1, x2, y2] = box;
  return (
    <div style={{ width: (x2-x1)*zoom, height: (y2-y1)*zoom, overflow: 'hidden', position: 'relative', flexShrink: 0, borderRadius: 8 }}>
      <img src={imageUrl} alt="" draggable={false} style={{
        position: 'absolute', left: -x1*zoom, top: -y1*zoom,
        width: naturalW*zoom, height: 'auto', maxWidth: 'none', display: 'block', userSelect: 'none',
      }} />
    </div>
  );
}

const MAX_HISTORY = 40;

const colLabel = (c) => {
  let label = '', n = c;
  do { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return label;
};

// Generic context menu — items are passed in directly
function CtxMenu({ menu, onClose }) {
  useEffect(() => {
    const onKey  = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    const onDown = () => onClose();
    window.addEventListener('keydown', onKey, { capture: true });
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true });
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const x = Math.min(menu.x, window.innerWidth  - 200);
  const y = Math.min(menu.y, window.innerHeight - 160);

  return ReactDOM.createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 99999,
        background: 'white', borderRadius: 8, padding: '4px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0', minWidth: 188,
      }}
    >
      {menu.items.map((item, i) =>
        item === null
          ? <div key={i} style={{ height: 1, background: '#f3f4f6', margin: '3px 0' }} />
          : (
            <button key={i} onClick={item.disabled ? undefined : item.action} disabled={item.disabled}
              style={{
                display: 'block', width: '100%', padding: '7px 14px',
                background: 'none', border: 'none', textAlign: 'left',
                cursor: item.disabled ? 'default' : 'pointer',
                fontSize: 12.5, color: item.disabled ? '#d1d5db' : item.danger ? '#ef4444' : '#374151',
              }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >{item.label}</button>
          )
      )}
    </div>,
    document.body
  );
}

export function OcrTableEditor({ annotation, imageUrl, onSave, onClose }) {
  const [rows, setRows]         = useState(() => normalizeRows(parseTableData(annotation.text).rows));
  // merges: [{r, c, colspan, rowspan}] — anchor cell at (r,c) spans the rectangle
  const [merges, setMerges]     = useState(() => parseTableData(annotation.text).merges);
  const [history, setHistory]   = useState([]);
  const [future, setFuture]     = useState([]);
  const [reorderDrag, setReorderDrag] = useState(null); // { type: 'row'|'col', from, over }
  const reorderDragRef = useRef(null);
  useEffect(() => { reorderDragRef.current = reorderDrag; }, [reorderDrag]);

  const [zoom, setZoom]         = useState(1.0);
  const [zoomInput, setZoomInput] = useState(null);
  const [splitPct, setSplitPct] = useState(38);
  const [divHovered, setDivHovered]       = useState(false);
  const [layoutFlipped, setLayoutFlipped] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]); // [{r,c}] for drag selection
  const [focusedCell, setFocusedCell]     = useState(null); // {r,c}
  const [ctxMenu, setCtxMenu]   = useState(null);

  const imgScrollRef = useRef(null);
  const zoomRef      = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Pinch / Ctrl+scroll on the image panel → image zoom only
  useEffect(() => {
    const el = imgScrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const current = zoomRef.current;
      const factor  = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const next    = Math.min(4, Math.max(0.2, current * factor));
      // cursor-centered scroll adjustment
      const rect    = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left + el.scrollLeft;
      const cursorY = e.clientY - rect.top  + el.scrollTop;
      const ratio   = next / current;
      // apply scroll after React re-renders with new zoom
      requestAnimationFrame(() => {
        el.scrollLeft = Math.max(0, cursorX * ratio - (e.clientX - rect.left));
        el.scrollTop  = Math.max(0, cursorY * ratio - (e.clientY - rect.top));
      });
      setZoom(+(next.toFixed(2)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const modalRef    = useRef(null);
  const isDragging  = useRef(false); // divider drag
  const dragStart   = useRef(null);  // cell drag-select start {r,c}
  const cellRefs    = useRef({});

  const [x1, y1, x2, y2] = annotation.box || [0,0,1,1];
  const isLandscape = layoutFlipped ? (x2-x1 < y2-y1) : (x2-x1 >= y2-y1);

  const rowsRef    = useRef(rows);
  const mergesRef  = useRef(merges);
  const historyRef = useRef(history);
  const futureRef  = useRef(future);
  const infoRef    = useRef(null);
  const cellSnapshotted = useRef(false);
  useEffect(() => { rowsRef.current    = rows;    }, [rows]);
  useEffect(() => { mergesRef.current  = merges;  }, [merges]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { futureRef.current  = future;  }, [future]);

  // ── history (snapshots {rows, merges}) ─────────────────────────────────────
  const commit = useCallback((newRows, newMerges) => {
    const snap = { rows: rowsRef.current, merges: mergesRef.current };
    setHistory(h => { const n = [...h, snap]; return n.length > MAX_HISTORY ? n.slice(1) : n; });
    setFuture([]);
    setRows(newRows);
    setMerges(newMerges);
  }, []);

  // For cell-text edits — no history push per keystroke; snapshot is taken on cell focus instead
  const updateRows = useCallback((updater) => {
    setRows(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current; if (!h.length) return;
    const snap = { rows: rowsRef.current, merges: mergesRef.current };
    setFuture(f => [snap, ...f]);
    const prev = h[h.length-1];
    setRows(prev.rows); setMerges(prev.merges); setHistory(h.slice(0,-1));
  }, []);
  const redo = useCallback(() => {
    const f = futureRef.current; if (!f.length) return;
    const snap = { rows: rowsRef.current, merges: mergesRef.current };
    setHistory(h => [...h, snap]);
    setRows(f[0].rows); setMerges(f[0].merges); setFuture(f.slice(1));
  }, []);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && !e.shiftKey && e.key === 'z') { e.preventDefault(); e.stopPropagation(); undo(); }
      if ((meta && e.key === 'y') || (meta && e.shiftKey && e.key === 'z')) { e.preventDefault(); e.stopPropagation(); redo(); }
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [undo, redo, onClose]);

  // End cell-drag and commit any row/col reorder on mouseup
  useEffect(() => {
    const onUp = () => {
      dragStart.current = null;
      const drag = reorderDragRef.current;
      if (drag) {
        document.activeElement?.blur();
        setFocusedCell(null);
        setSelectedCells([]);
        if (drag.type === 'row') moveRow(drag.from, drag.over);
        else                     moveCol(drag.from, drag.over);
        setReorderDrag(null);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, merges]); // re-bind when rows/merges change so moveRow/moveCol close over latest state

  // ── zoom ──────────────────────────────────────────────────────────────────
  const commitZoom = raw => {
    const p = parseInt(raw, 10);
    if (!isNaN(p)) setZoom(Math.min(4, Math.max(0.2, p/100)));
    setZoomInput(null);
  };

  // ── divider drag ──────────────────────────────────────────────────────────
  const onDividerMouseDown = useCallback(e => {
    e.preventDefault(); isDragging.current = true;
    const onMove = e => {
      if (!isDragging.current || !modalRef.current) return;
      const rect = modalRef.current.getBoundingClientRect();
      const pct = isLandscape ? ((e.clientY-rect.top)/rect.height)*100 : ((e.clientX-rect.left)/rect.width)*100;
      setSplitPct(Math.min(65, Math.max(20, pct)));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [isLandscape]);

  // ── merge helpers ─────────────────────────────────────────────────────────
  const getMerge  = (r, c) => merges.find(m => m.r === r && m.c === c);
  const isCovered = (r, c) => merges.some(m => {
    const rEnd = m.r + (m.rowspan || 1);
    const cEnd = m.c + (m.colspan || 1);
    return (r > m.r || c > m.c) && r >= m.r && r < rEnd && c >= m.c && c < cEnd;
  });

  const isSelected = (r, c) => selectedCells.some(sc => sc.r === r && sc.c === c);

  const mergeCells = () => {
    const selRows = [...new Set(selectedCells.map(sc => sc.r))].sort((a,b) => a-b);
    const selCols = [...new Set(selectedCells.map(sc => sc.c))].sort((a,b) => a-b);
    const minR = selRows[0], maxR = selRows[selRows.length-1];
    const minC = selCols[0], maxC = selCols[selCols.length-1];
    const colspan = maxC - minC + 1, rowspan = maxR - minR + 1;
    const mergedText = selRows.flatMap(r => selCols.map(c => rows[r][c])).filter(Boolean).join(' ');
    const newRows = rows.map(row => [...row]);
    newRows[minR][minC] = mergedText;
    for (const r of selRows) for (const c of selCols) if (r !== minR || c !== minC) newRows[r][c] = '';
    const newMerges = [
      ...mergesRef.current.filter(m => !(m.r >= minR && m.r <= maxR && m.c >= minC && m.c <= maxC)),
      { r: minR, c: minC, colspan, rowspan },
    ];
    commit(newRows, newMerges);
    setSelectedCells([]);
  };

  const unmergeCells = (r, c) => {
    commit(rowsRef.current, mergesRef.current.filter(m => !(m.r===r && m.c===c)));
    setSelectedCells([]);
  };

  // ── table operations (keep merges consistent) ─────────────────────────────
  const handleCellChange = (r, c, val) => {
    if (!cellSnapshotted.current) {
      cellSnapshotted.current = true;
      const snap = { rows: rowsRef.current, merges: mergesRef.current };
      setHistory(h => { const n = [...h, snap]; return n.length > MAX_HISTORY ? n.slice(1) : n; });
      setFuture([]);
    }
    updateRows(prev => { const n = prev.map(row=>[...row]); n[r][c] = val; return n; });
  };

  const insertRowAt = index => {
    const newRows = [...rows]; newRows.splice(index, 0, Array(rows[0]?.length||1).fill(''));
    const newMerges = mergesRef.current.map(m => {
      if (m.r >= index) return {...m, r: m.r+1};
      if (m.r < index && m.r+(m.rowspan||1) > index) return {...m, rowspan: (m.rowspan||1)+1};
      return m;
    });
    commit(newRows, newMerges);
  };
  const removeRow = r => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_,i) => i!==r);
    const newMerges = mergesRef.current
      .map(m => {
        if (m.r === r) return (m.rowspan||1)>1 ? {...m, rowspan: (m.rowspan||1)-1} : null;
        if (m.r > r)   return {...m, r: m.r-1};
        if (m.r < r && m.r+(m.rowspan||1) > r) return {...m, rowspan: (m.rowspan||1)-1};
        return m;
      })
      .filter(Boolean)
      .filter(m => (m.colspan||1)>1 || (m.rowspan||1)>1);
    commit(newRows, newMerges);
    setSelectedCells(sc => sc.filter(c=>c.r!==r));
  };
  const insertColAt = index => {
    const newRows = rows.map(row => { const next=[...row]; next.splice(index,0,''); return next; });
    const newMerges = mergesRef.current.map(m => {
      if (m.c >= index) return {...m, c: m.c+1};
      if (m.c < index && m.c+(m.colspan||1) > index) return {...m, colspan: (m.colspan||1)+1};
      return m;
    });
    commit(newRows, newMerges);
  };
  const removeCol = c => {
    if ((rows[0]?.length||1) <= 1) return;
    const newRows = rows.map(row => row.filter((_,i)=>i!==c));
    const newMerges = mergesRef.current
      .map(m => {
        if (m.c === c) return (m.colspan||1)>1 ? {...m, colspan: (m.colspan||1)-1} : null;
        if (m.c > c)   return {...m, c: m.c-1};
        if (m.c < c && m.c+(m.colspan||1) > c) return {...m, colspan: (m.colspan||1)-1};
        return m;
      })
      .filter(Boolean)
      .filter(m => (m.colspan||1)>1 || (m.rowspan||1)>1);
    commit(newRows, newMerges);
    setSelectedCells(sc => sc.filter(cell=>cell.c!==c));
  };

  const moveRow = (from, to) => {
    if (from === to) return;
    const newRows = [...rows];
    const [moved] = newRows.splice(from, 1);
    newRows.splice(to, 0, moved);
    const newMerges = mergesRef.current.map(m => {
      let r = m.r;
      if (r === from)                            r = to;
      else if (from < to && r > from && r <= to) r -= 1;
      else if (from > to && r >= to && r < from) r += 1;
      return { ...m, r };
    });
    commit(newRows, newMerges);
  };

  const moveCol = (from, to) => {
    if (from === to) return;
    const newRows = rows.map(row => {
      const r = [...row];
      const [moved] = r.splice(from, 1);
      r.splice(to, 0, moved);
      return r;
    });
    const newMerges = mergesRef.current.map(m => {
      let c = m.c;
      if (c === from)                            c = to;
      else if (from < to && c > from && c <= to) c -= 1;
      else if (from > to && c >= to && c < from) c += 1;
      return { ...m, c };
    });
    commit(newRows, newMerges);
  };

  // ── cell drag-select ──────────────────────────────────────────────────────
  const buildRect = (a, b) => {
    const minR = Math.min(a.r, b.r), maxR = Math.max(a.r, b.r);
    const minC = Math.min(a.c, b.c), maxC = Math.max(a.c, b.c);
    const cells = [];
    for (let rr = minR; rr <= maxR; rr++)
      for (let cc = minC; cc <= maxC; cc++)
        cells.push({ r: rr, c: cc });
    return cells;
  };
  const onCellMouseDown = (r, c, e) => {
    if (e.button === 2) return; // ignore right-click — preserve existing selection
    dragStart.current = { r, c };
    setSelectedCells([{ r, c }]);
  };
  const onCellMouseEnter = (r, c, e) => {
    if (e.buttons !== 1 || !dragStart.current) return;
    setSelectedCells(buildRect(dragStart.current, { r, c }));
  };

  // ── merge/unmerge eligibility (used by toolbar buttons) ───────────────────
  const canMerge = (() => {
    if (selectedCells.length < 2) return false;
    const selRows = [...new Set(selectedCells.map(sc => sc.r))].sort((a,b) => a-b);
    const selCols = [...new Set(selectedCells.map(sc => sc.c))].sort((a,b) => a-b);
    // must be a filled rectangle
    if (selectedCells.length !== selRows.length * selCols.length) return false;
    // rows and cols must be contiguous
    for (let i=1;i<selRows.length;i++) if (selRows[i]!==selRows[i-1]+1) return false;
    for (let i=1;i<selCols.length;i++) if (selCols[i]!==selCols[i-1]+1) return false;
    const minR = selRows[0], maxR = selRows[selRows.length-1];
    const minC = selCols[0], maxC = selCols[selCols.length-1];
    // no cell covered by a merge that starts outside the selection
    if (selectedCells.some(({r,c}) => isCovered(r,c))) return false;
    // any merge anchor inside the selection must be fully contained within it
    return !selectedCells.some(({r,c}) => {
      const m = getMerge(r, c);
      if (!m) return false;
      return m.r < minR || m.r + (m.rowspan||1) - 1 > maxR ||
             m.c < minC || m.c + (m.colspan||1) - 1 > maxC;
    });
  })();

  const canUnmerge = selectedCells.length === 1 && !!getMerge(selectedCells[0]?.r, selectedCells[0]?.c);

  // ── cell context menu ─────────────────────────────────────────────────────
  const openCellCtx = (e, r, c) => {
    e.preventDefault();
    document.activeElement?.blur();
    const items = [];
    if (canMerge && selectedCells.some(sc => sc.r===r && sc.c===c))
      items.push({ label: 'Merge selected cells', action: () => { mergeCells(); setCtxMenu(null); } });
    const merge = getMerge(r, c);
    if (merge) items.push({ label: 'Unmerge', action: () => { unmergeCells(r,c); setCtxMenu(null); } });
    if (items.length) setCtxMenu({ items, x: e.clientX, y: e.clientY });
  };
  const openHeaderCtx = (e, kind, index) => {
    e.preventDefault();
    document.activeElement?.blur();
    const isRow = kind === 'row';
    const colCount = rows[0]?.length || 1;
    setCtxMenu({ x: e.clientX, y: e.clientY, ...(isRow ? { rowIndex: index } : { colIndex: index }), items: [
      { label: isRow ? 'Insert row above'   : 'Insert column left',  action: () => { (isRow ? insertRowAt : insertColAt)(index);   setCtxMenu(null); } },
      { label: isRow ? 'Insert row below'   : 'Insert column right', action: () => { (isRow ? insertRowAt : insertColAt)(index+1); setCtxMenu(null); } },
      null,
      { label: isRow ? 'Move up'   : 'Move left',  disabled: index === 0,
        action: () => { isRow ? moveRow(index, index-1) : moveCol(index, index-1); setCtxMenu(null); } },
      { label: isRow ? 'Move down' : 'Move right', disabled: isRow ? index === rows.length-1 : index === colCount-1,
        action: () => { isRow ? moveRow(index, index+1) : moveCol(index, index+1); setCtxMenu(null); } },
      null,
      { label: isRow ? 'Delete row' : 'Delete column', danger: true,
        disabled: isRow ? rows.length<=1 : colCount<=1,
        action: () => { (isRow ? removeRow : removeCol)(index); setCtxMenu(null); } },
    ]});
  };

  const handleSave = () => { onSave(serializeTable(rows, merges)); onClose(); };
  const handleCopy = () => {
    const tsv = rows.map(row=>row.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv).then(() => { setCopied(true); setTimeout(()=>setCopied(false),1500); });
  };

  // ── image panel ───────────────────────────────────────────────────────────
  const ImagePanel = (
    <div className="flex flex-col overflow-hidden bg-gray-50/60" style={isLandscape ? {height:`${splitPct}%`,flexShrink:0} : {width:`${splitPct}%`,flexShrink:0}}>
      <div ref={imgScrollRef} className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <CroppedImage imageUrl={imageUrl} box={annotation.box} zoom={zoom} />
      </div>
      <div className="flex items-center justify-center gap-0.5 py-2 border-t border-gray-100 flex-shrink-0">
        <button onClick={() => setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)))} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><ZoomOut size={13}/></button>
        {zoomInput !== null
          ? <input autoFocus type="text" value={zoomInput} onChange={e=>setZoomInput(e.target.value)} onBlur={()=>commitZoom(zoomInput)} onKeyDown={e=>{if(e.key==='Enter')commitZoom(zoomInput);if(e.key==='Escape')setZoomInput(null);}} className="tabular-nums w-10 text-center text-xs text-gray-700 font-medium bg-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400"/>
          : <span onClick={()=>setZoomInput(String(Math.round(zoom*100)))} className="tabular-nums w-10 text-center text-xs text-gray-700 font-medium cursor-text hover:bg-gray-100 rounded-md px-1 transition-colors">{Math.round(zoom*100)}%</span>
        }
        <button onClick={() => setZoom(z=>Math.min(4,+(z+0.1).toFixed(1)))} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><ZoomIn size={13}/></button>
      </div>
    </div>
  );

  // ── divider ───────────────────────────────────────────────────────────────
  const Divider = (
    <div onMouseDown={onDividerMouseDown} onMouseEnter={()=>setDivHovered(true)} onMouseLeave={()=>setDivHovered(false)}
      className="relative flex-shrink-0 flex items-center justify-center select-none"
      style={isLandscape ? {height:8,cursor:'row-resize',width:'100%'} : {width:8,cursor:'col-resize'}}>
      <div className="transition-colors duration-150" style={{
        ...(isLandscape ? {position:'absolute',top:'50%',left:0,right:0,height:2,transform:'translateY(-50%)'} : {position:'absolute',left:'50%',top:0,bottom:0,width:2,transform:'translateX(-50%)'}),
        backgroundColor: divHovered ? '#fb923c' : '#e5e7eb',
      }}/>
      <div className="relative z-10 flex items-center justify-center rounded-full bg-white transition-all duration-150"
        style={{
          ...(isLandscape ? {flexDirection:'row',gap:3,paddingLeft:6,paddingRight:6,paddingTop:2,paddingBottom:2} : {flexDirection:'column',gap:3,padding:'6px 2px'}),
          border:`1px solid ${divHovered?'#fdba74':'#e5e7eb'}`,
          boxShadow: divHovered ? '0 0 0 2px #fff7ed' : '0 1px 2px rgba(0,0,0,0.05)',
        }}>
        {[0,1,2].map(i=><div key={i} className="w-[3px] h-[3px] rounded-full transition-colors duration-150" style={{backgroundColor:divHovered?'#f97316':'#9ca3af'}}/>)}
      </div>
    </div>
  );

  // ── grid panel ────────────────────────────────────────────────────────────
  const GridPanel = (
    <div className="flex-1 overflow-auto p-4" onMouseLeave={() => { dragStart.current = null; }}>
      <table className="border-collapse text-sm" style={{ tableLayout: 'auto', cursor: reorderDrag ? 'grabbing' : undefined }}>
        <thead>
          <tr>
            <th style={{ width: 32 }} />
            {rows[0]?.map((_, c) => {
              return (
                <th key={c}
                  onContextMenu={e => openHeaderCtx(e, 'col', c)}
                  onMouseEnter={() => { if (reorderDrag?.type === 'col') setReorderDrag(d => ({...d, over: c})); }}
                  style={(() => {
                    const isFrom = reorderDrag?.type === 'col' && reorderDrag.from === c;
                    const isOver = reorderDrag?.type === 'col' && reorderDrag.over === c && reorderDrag.from !== c;
                    const movingRight = reorderDrag?.from < reorderDrag?.over;
                    const colCtxActive = ctxMenu?.colIndex === c;
                    return {
                      minWidth: '5rem', padding: '4px 2px 6px', textAlign: 'center',
                      background: isFrom || colCtxActive ? '#fff3e8' : undefined,
                      borderLeft:  isOver && !movingRight ? '1px solid #f97316' : undefined,
                      borderRight: isOver &&  movingRight ? '1px solid #f97316' : undefined,
                      transition: 'background 0.12s, border-color 0.08s ease',
                      userSelect: 'none',
                    };
                  })()}>
                  <span
                    onMouseDown={e => { if (e.button !== 0) return; e.preventDefault(); setReorderDrag({ type: 'col', from: c, over: c }); }}
                    style={{
                      display: 'inline-block', padding: '4px 12px',
                      fontSize: 10, fontVariantNumeric: 'tabular-nums',
                      cursor: reorderDrag?.type === 'col' ? 'grabbing' : 'grab',
                      color: (reorderDrag?.type === 'col' && reorderDrag.from === c) || ctxMenu?.colIndex === c ? '#f97316' : '#9ca3af',
                      fontWeight: (reorderDrag?.type === 'col' && reorderDrag.from === c) || ctxMenu?.colIndex === c ? 600 : 400,
                      borderRadius: 4,
                      transition: 'color 0.12s',
                      letterSpacing: '0.02em',
                    }}>{colLabel(c)}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const rowCtxActive  = ctxMenu?.rowIndex === r;
            const rowDragOver   = reorderDrag?.type === 'row' && reorderDrag.over === r && reorderDrag.from !== r;
            const rowDragDown   = reorderDrag?.from < reorderDrag?.over;
            return (
              <tr key={r} onMouseEnter={() => { if (reorderDrag?.type === 'row') setReorderDrag(d => ({...d, over: r})); }}>
                <td
                  onContextMenu={e => openHeaderCtx(e, 'row', r)}
                  style={{
                    width: 32, padding: '0 2px', textAlign: 'center', verticalAlign: 'middle',
                    userSelect: 'none',
                    borderTop:    rowDragOver && !rowDragDown ? '1px solid #f97316' : undefined,
                    borderBottom: rowDragOver &&  rowDragDown ? '1px solid #f97316' : undefined,
                    background: (reorderDrag?.type === 'row' && reorderDrag.from === r) || rowCtxActive ? '#fff3e8' : undefined,
                    transition: 'background 0.12s, border-color 0.08s ease',
                  }}>
                  <span
                    onMouseDown={e => { if (e.button !== 0) return; e.preventDefault(); setReorderDrag({ type: 'row', from: r, over: r }); }}
                    style={{
                      display: 'inline-block', padding: '4px 10px',
                      fontSize: 10, fontVariantNumeric: 'tabular-nums',
                      cursor: reorderDrag?.type === 'row' ? 'grabbing' : 'grab',
                      color: (reorderDrag?.type === 'row' && reorderDrag.from === r) || rowCtxActive ? '#f97316' : '#9ca3af',
                      fontWeight: reorderDrag?.type === 'row' && reorderDrag.from === r ? 600 : 400,
                      borderRadius: 4,
                      transition: 'color 0.12s',
                    }}>{r+1}</span>
                </td>

                {row.map((cell, c) => {
                  if (isCovered(r, c)) return null;
                  const merge = getMerge(r, c);
                  const sel   = isSelected(r, c);
                  const hlCol = ctxMenu?.colIndex === c;
                  const hlRow = ctxMenu?.rowIndex === r;
                  return (
                    <td key={c}
                      colSpan={merge?.colspan || 1}
                      rowSpan={merge?.rowspan || 1}
                      onMouseDown={e => onCellMouseDown(r, c, e)}
                      onMouseEnter={e => {
                        onCellMouseEnter(r, c, e);
                        if (reorderDrag?.type === 'row') setReorderDrag(d => ({...d, over: r}));
                        if (reorderDrag?.type === 'col') setReorderDrag(d => ({...d, over: c}));
                      }}
                      onContextMenu={e => openCellCtx(e, r, c)}
                      style={(() => {
                        const focused = focusedCell?.r===r && focusedCell?.c===c;
                        const showSel = sel && !focused;
                        const colDragOver  = reorderDrag?.type === 'col' && reorderDrag.over === c && reorderDrag.from !== c;
                        const colDragRight = reorderDrag?.from < reorderDrag?.over;
                        const G = '#f3f4f6', O = '#f97316';
                        const cellShadow = focused ? 'inset 0 0 0 2px #fb923c90' : showSel ? 'inset 0 0 0 1.5px #93c5fd' : null;
                        return {
                          padding: 0, minWidth: '5rem',
                          borderTop:    `1px solid ${rowDragOver && !rowDragDown ? O : G}`,
                          borderBottom: `1px solid ${rowDragOver &&  rowDragDown ? O : G}`,
                          borderLeft:   `1px solid ${colDragOver && !colDragRight ? O : G}`,
                          borderRight:  `1px solid ${colDragOver &&  colDragRight ? O : G}`,
                          background: focused ? '#fff7ed40' : showSel ? '#eff6ff' : hlCol || hlRow ? '#fff9f5' : undefined,
                          boxShadow: cellShadow || undefined,
                          position: focused || showSel ? 'relative' : undefined,
                          zIndex:    focused ? 2 : showSel ? 1 : undefined,
                          transition: 'background 0.15s, border-color 0.08s ease',
                        };
                      })()}>
                      <input
                        ref={el => { if (el) cellRefs.current[`${r}-${c}`] = el; }}
                        value={cell}
                        onMouseDown={e => { if (e.button === 2) e.preventDefault(); }}
                        onChange={e => handleCellChange(r, c, e.target.value)}
                        onKeyDown={e => {
                          if (e.key !== 'Tab') return;
                          e.preventDefault();
                          const rc = rows.length, cc = rows[0]?.length||1;
                          let [nr, nc] = [r, e.shiftKey ? c-1 : c+1];
                          if (nc >= cc) { nc=0; nr=r+1; } if (nc<0) { nc=cc-1; nr=r-1; }
                          nr = ((nr%rc)+rc)%rc;
                          cellRefs.current[`${nr}-${nc}`]?.focus();
                        }}
                        className="w-full px-2.5 py-1.5 text-sm bg-transparent focus:outline-none text-gray-600"
                        onFocus={() => {
                          setFocusedCell({ r, c });
                          cellSnapshotted.current = false;
                        }}
                        onBlur={()  => setFocusedCell(null)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ── portal render ─────────────────────────────────────────────────────────
  const modal = ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div ref={modalRef} tabIndex={-1} className="bg-white rounded-2xl shadow-2xl flex flex-col outline-none"
        style={{ width:'92vw', height:'90vh', maxWidth:1200 }} onClick={e=>{ e.stopPropagation(); setShowHelp(false); }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Table Editor</span>
            <button ref={infoRef} onClick={e => { e.stopPropagation(); setShowHelp(v => !v); }}
              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${showHelp ? 'bg-orange-50 text-orange-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              <Info size={13}/>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={undo} disabled={!history.length} title="Undo (⌘Z)" className="px-2 py-1.5 hover:bg-gray-50 disabled:opacity-30 transition-colors text-gray-600"><Undo2 size={13}/></button>
              <div className="w-px h-4 bg-gray-200"/>
              <button onClick={redo} disabled={!future.length}  title="Redo (⌘Y)" className="px-2 py-1.5 hover:bg-gray-50 disabled:opacity-30 transition-colors text-gray-600"><Redo2 size={13}/></button>
            </div>
            <button onClick={()=>setLayoutFlipped(v=>!v)} title={isLandscape?'Side-by-side':'Top-bottom'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              {isLandscape ? <Columns2 size={13}/> : <Rows2 size={13}/>}
            </button>
<button onClick={handleCopy} title="Copy as TSV"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${copied?'text-green-600 border-green-200 bg-green-50':'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {copied ? <Check size={13}/> : <ClipboardCopy size={13}/>}
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              <X size={12}/> Close
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              <Save size={12}/> Save
            </button>
          </div>
        </div>
        <div className={`flex flex-1 overflow-hidden ${isLandscape?'flex-col':'flex-row'}`}>
          {ImagePanel}{Divider}{GridPanel}
        </div>
      </div>
    </div>,
    document.body
  );

  const helpPortal = showHelp && infoRef.current && ReactDOM.createPortal((() => {
    const rect = infoRef.current.getBoundingClientRect();
    return (
      <div style={{ position: 'fixed', top: rect.bottom + 8, left: rect.left, zIndex: 10001, width: 260 }}
        className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-xs text-gray-600 max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Keyboard shortcuts</p>
        <div className="space-y-1.5 mb-4">
          {[
            ['⌘Z / Ctrl+Z',       'Undo'],
            ['⌘Y / Ctrl+Shift+Z', 'Redo'],
            ['Tab',               'Next cell'],
            ['Shift+Tab',         'Previous cell'],
            ['Esc',               'Close editor'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-gray-500">{desc}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] whitespace-nowrap">{key}</kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Mouse actions</p>
        <div className="space-y-1.5 mb-4">
          {[
            ['Click cell',              'Focus & edit'],
            ['Drag across cells',       'Select region'],
            ['Right-click selection',   'Merge cells'],
            ['Right-click merged cell', 'Unmerge'],
            ['Right-click row number',  'Insert / delete / move row'],
            ['Right-click col letter',  'Insert / delete / move column'],
            ['Drag row number / col letter', 'Reorder rows & columns'],
          ].map(([action, desc]) => (
            <div key={action} className="flex items-start justify-between gap-4">
              <span className="text-gray-500 shrink-0">{desc}</span>
              <span className="text-gray-400 text-right">{action}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Toolbar</p>
        <div className="space-y-1.5">
          {[
            ['Undo / Redo',    'Step through edit history'],
            ['Layout toggle',  'Switch image side/top'],
            ['Copy',           'Copy table as TSV'],
            ['Save',           'Save & close'],
          ].map(([action, desc]) => (
            <div key={action} className="flex items-start justify-between gap-4">
              <span className="text-gray-500 shrink-0">{desc}</span>
              <span className="text-gray-400 text-right">{action}</span>
            </div>
          ))}
        </div>
      </div>
    );
  })(), document.body);

  return (
    <>
      {modal}
      {ctxMenu && <CtxMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />}
      {helpPortal}
    </>
  );
}
