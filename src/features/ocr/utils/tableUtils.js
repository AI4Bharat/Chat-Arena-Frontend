/**
 * Parse OCR table text into a 2D array of strings.
 * Handles JSON (rows+merges), markdown tables, TSV, and plain text.
 */
export function parseTableText(text) {
  if (!text?.trim()) return [['']];

  // JSON format — extract rows only (merges ignored here; use parseTableData for both)
  if (text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed.rows)) return parsed.rows;
    } catch {}
  }

  const lines = text.trim().split('\n');

  // Markdown table (contains pipe separators)
  if (lines[0].includes('|')) {
    const rows = lines
      .filter(l => !/^\s*[\|\-\:\+\s]+$/.test(l)) // drop separator rows
      .map(l => {
        const cols = l.split('|');
        // strip leading/trailing empty cells from `| ... |` format
        if (cols[0].trim() === '') cols.shift();
        if (cols[cols.length - 1].trim() === '') cols.pop();
        return cols.map(c => c.trim());
      });
    if (rows.length > 0 && rows[0].length > 1) return rows;
  }

  // TSV
  if (lines.some(l => l.includes('\t'))) {
    return lines.map(l => l.split('\t').map(c => c.trim()));
  }

  // Fallback — single column
  return lines.map(l => [l]);
}

/**
 * Parse table text into {rows, merges}.
 * Merges are only preserved when text is in JSON format.
 * Rows are always normalized to the same column count.
 */
export function parseTableData(text) {
  if (!text?.trim()) return { rows: [['']], merges: [] };

  if (text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed.rows)) {
        return {
          rows: normalizeRows(parsed.rows),
          merges: Array.isArray(parsed.merges) ? parsed.merges : [],
        };
      }
    } catch {}
  }

  return { rows: normalizeRows(parseTableText(text)), merges: [] };
}

/** Serialize rows + merges. Uses JSON when merges exist, TSV otherwise. */
export function serializeTable(rows, merges = []) {
  if (merges.length > 0) return JSON.stringify({ rows, merges });
  return rows.map(row => row.join('\t')).join('\n');
}

/** Normalize rows so all have the same column count. */
export function normalizeRows(rows) {
  const cols = Math.max(...rows.map(r => r.length), 1);
  return rows.map(row => {
    const padded = [...row];
    while (padded.length < cols) padded.push('');
    return padded;
  });
}
