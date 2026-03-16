import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { TYPE_OPTIONS, getTypeColor } from '../utils/typeColors';

/**
 * TypeDropdown — custom type selector.
 * Menu is portalled into document.body so it escapes all overflow/transform ancestors.
 */
export function TypeDropdown({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const color = getTypeColor(value);
  const label = TYPE_OPTIONS.find(o => o.value === value)?.label ?? value;

  const calcPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = TYPE_OPTIONS.length * 32 + 8;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuH + 8;
    setMenuStyle({
      position: 'fixed',
      left: r.left,
      minWidth: Math.max(r.width, 120),
      zIndex: 9999,
      ...(openUp
        ? { bottom: window.innerHeight - r.top + 4 }
        : { top: r.bottom + 4 }),
    });
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open) calcPosition();
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const menu = open && createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white rounded-xl shadow-lg border border-gray-100 py-1"
    >
      {TYPE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 ${
            opt.value === value ? 'bg-gray-50' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getTypeColor(opt.value) }} />
          <span className="font-medium" style={{ color: opt.value === value ? getTypeColor(opt.value) : '#374151' }}>
            {opt.label}
          </span>
          {opt.value === value && (
            <span className="ml-auto text-[9px] font-semibold" style={{ color: getTypeColor(opt.value) }}>✓</span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1 transition-colors ${
          compact
            ? 'rounded-md px-1.5 py-0.5'
            : 'border border-gray-200 bg-white/80 hover:bg-gray-50 px-2 py-1 rounded-lg shadow-sm'
        }`}
        style={compact ? { border: `1px solid ${color}55`, backgroundColor: `${color}10` } : undefined}
      >
        {!compact && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
        <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
        <ChevronDown size={9} style={{ color }} className="opacity-60" />
      </button>
      {menu}
    </div>
  );
}
