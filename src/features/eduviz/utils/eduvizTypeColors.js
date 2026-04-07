// Color map for EduViz error annotation types
// Values are CSS hex colors used for: box stroke, card border, type badge

export const EDUVIZ_TYPE_COLORS = {
  spelling_error:       '#ef4444', // red
  grammar_error:        '#3b82f6', // blue
  arithmetic_error:     '#22c55e', // green
  diagram_label_error:  '#f59e0b', // amber
  conceptual_error:     '#8b5cf6', // purple
};

export const EDUVIZ_TYPE_LABELS = {
  spelling_error:       'Spelling',
  grammar_error:        'Grammar',
  arithmetic_error:     'Arithmetic',
  diagram_label_error:  'Diagram',
  conceptual_error:     'Concept',
};

export const EDUVIZ_TYPE_OPTIONS = [
  { value: 'spelling_error',      label: 'Spelling Error',       icon: '✏️' },
  { value: 'grammar_error',       label: 'Grammar Error',        icon: '📝' },
  { value: 'arithmetic_error',    label: 'Arithmetic Error',     icon: '🔢' },
  { value: 'diagram_label_error', label: 'Diagram Label Error',  icon: '🏷️' },
  { value: 'conceptual_error',    label: 'Conceptual Error',     icon: '💡' },
];

export function getEduvizTypeColor(type) {
  return EDUVIZ_TYPE_COLORS[type] || '#6b7280';
}

export function getEduvizTypeLabel(type) {
  return EDUVIZ_TYPE_LABELS[type] || type;
}

// Returns a hex color with an alpha suffix as rgba for fill
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
