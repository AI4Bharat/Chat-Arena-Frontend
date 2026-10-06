// Categories shared by answer boxes (overall verdict) and finding boxes.
// Keep in sync with CATEGORIES in backend ai_model/evaluation_interactions.py.
export const EVAL_CATEGORIES = {
  correct:       { label: 'Correct',       short: 'Correct', color: '#16a34a' },
  minor_mistake: { label: 'Minor mistake', short: 'Minor',   color: '#d97706' },
  major_mistake: { label: 'Major mistake', short: 'Major',   color: '#dc2626' },
  incomplete:    { label: 'Incomplete',    short: 'Incomplete', color: '#2563eb' },
  illegible:     { label: 'Illegible',     short: 'Illegible',  color: '#6b7280' },
  unattempted:   { label: 'Not attempted', short: 'Blank',   color: '#7c3aed' },
};

export const EVAL_CATEGORY_OPTIONS = Object.entries(EVAL_CATEGORIES).map(([value, c]) => ({
  value,
  label: c.label,
}));

export const DEFAULT_MAX_MARKS = 10;

export function categoryColor(category) {
  return EVAL_CATEGORIES[category]?.color || '#6b7280';
}

export function categoryLabel(category) {
  return EVAL_CATEGORIES[category]?.label || category || 'Uncategorised';
}

export function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Round to the nearest 0.5 and clamp into [min, max]. Returns null for blank input. */
export function clampMarks(value, min, max) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n * 2) / 2));
}

export function formatMarks(value) {
  if (value === null || value === undefined || value === '') return '–';
  return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(1));
}

export function breakdownTotal(breakdown) {
  return (breakdown || []).reduce((sum, row) => sum + (Number(row.awarded) || 0), 0);
}
