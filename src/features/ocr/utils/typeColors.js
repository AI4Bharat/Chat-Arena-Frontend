// Color map for OCR annotation types
// Values are CSS hex colors used for: box stroke, card border, type badge

export const TYPE_COLORS = {
  title:     '#8b5cf6', // purple
  heading:   '#6366f1', // indigo
  paragraph: '#3b82f6', // blue
  table:     '#22c55e', // green
  figure:    '#f97316', // orange
  image:     '#f97316', // orange (alias)
  caption:   '#f59e0b', // amber
  list:      '#14b8a6', // teal
  other:     '#6b7280', // gray
};

export const TYPE_LABELS = {
  title:     'Title',
  heading:   'Heading',
  paragraph: 'Para',
  table:     'Table',
  figure:    'Figure',
  image:     'Figure',
  caption:   'Caption',
  list:      'List',
  other:     'Other',
};

export const TYPE_OPTIONS = [
  { value: 'title',     label: 'Title' },
  { value: 'heading',   label: 'Heading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'table',     label: 'Table' },
  { value: 'figure',    label: 'Figure' },
  { value: 'caption',   label: 'Caption' },
  { value: 'list',      label: 'List' },
  { value: 'other',     label: 'Other' },
];

export function getTypeColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.other;
}

export function getTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

// Returns a hex color with an alpha suffix as rgba for fill
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
