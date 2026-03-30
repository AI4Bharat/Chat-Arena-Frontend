import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell,
         TextRun, WidthType, BorderStyle } from 'docx';
import { parseTableData } from './tableUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

/**
 * Get the ordered, edited annotation list for a page.
 * Uses the base array for order, then overlays edited text/type/box.
 */
function getPageAnnotations(annotations, editedAnnotations, sessionId, pageIndex, participant) {
  const pageKey = `${sessionId}_${pageIndex}`;
  const base = annotations[pageKey]?.[participant] || annotations[sessionId]?.[participant] || [];
  const edited = editedAnnotations[pageKey]?.[participant] || editedAnnotations[sessionId]?.[participant] || {};
  return base.map(ann => ({ ...ann, ...(edited[ann.id] || {}) }));
}

// ─── Table converters ─────────────────────────────────────────────────────────

/** Build covered-cell set and merge map from a merges array. */
function buildMergeInfo(merges) {
  const mergeMap = {};
  const covered = new Set();
  for (const m of (merges || [])) {
    mergeMap[`${m.r}_${m.c}`] = m;
    for (let r = m.r; r < m.r + (m.rowspan || 1); r++) {
      for (let c = m.c; c < m.c + (m.colspan || 1); c++) {
        if (r !== m.r || c !== m.c) covered.add(`${r}_${c}`);
      }
    }
  }
  return { mergeMap, covered };
}

/** Convert table text (JSON/TSV) to an HTML <table> string. */
function tableToHtml(text) {
  const { rows, merges } = parseTableData(text);
  const { mergeMap, covered } = buildMergeInfo(merges);
  let html = '<table>\n';
  rows.forEach((row, r) => {
    html += '<tr>\n';
    row.forEach((cell, c) => {
      if (covered.has(`${r}_${c}`)) return;
      const m = mergeMap[`${r}_${c}`];
      const attrs = [];
      if (m?.rowspan > 1) attrs.push(`rowspan="${m.rowspan}"`);
      if (m?.colspan > 1) attrs.push(`colspan="${m.colspan}"`);
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
      html += `<td${attrStr}>${escHtml(cell)}</td>\n`;
    });
    html += '</tr>\n';
  });
  html += '</table>';
  return html;
}

/** Convert table text to a GFM markdown table.
 *  If the table has merged cells (colspan/rowspan), falls back to an inline
 *  HTML <table> block — GitHub and most renderers handle it correctly. */
function tableToMarkdown(text) {
  const { rows, merges } = parseTableData(text);
  if (!rows.length) return '';

  // Merged cells can't be expressed in GFM pipe syntax → use inline HTML
  if (merges && merges.length > 0) {
    return tableToHtml(text);
  }

  const cols = Math.max(...rows.map(r => r.length), 1);
  const pad = row => { const r = [...row]; while (r.length < cols) r.push(''); return r; };
  const lines = rows.map((row, i) => {
    const cells = pad(row).map(c => (c || '').replace(/\|/g, '\\|').replace(/\n/g, ' '));
    const line = '| ' + cells.join(' | ') + ' |';
    if (i === 0) return line + '\n|' + Array(cols).fill(' --- ').join('|') + '|';
    return line;
  });
  return lines.join('\n');
}

// A4 page content width in DXA (21cm page − 2×2.54cm margins ≈ 15.92cm = 9026 twips)
const PAGE_WIDTH_DXA = 9026;

/** Convert table text to docx Table object. */
function tableToDocx(text) {
  const { rows, merges } = parseTableData(text);
  const { mergeMap, covered } = buildMergeInfo(merges);
  const BORDER = { style: BorderStyle.SINGLE, size: 6, color: '333333' };
  const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

  // Distribute columns evenly across the full page width
  const numCols = Math.max(...rows.map(r => r.length), 1);
  const colWidth = Math.floor(PAGE_WIDTH_DXA / numCols);

  const docxRows = rows.map((row, r) => {
    const cells = [];
    row.forEach((cell, c) => {
      if (covered.has(`${r}_${c}`)) return;
      const m = mergeMap[`${r}_${c}`];
      const span = m?.colspan || 1;
      cells.push(new TableCell({
        children: [new Paragraph({ children: textRuns(cell || '') })],
        borders,
        columnSpan: span,
        rowSpan: m?.rowspan || 1,
        width: { size: colWidth * span, type: WidthType.DXA },
      }));
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    rows: docxRows,
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: Array(numCols).fill(colWidth),
  });
}

/** Convert a string with \n into an array of TextRuns with line breaks. */
function textRuns(str) {
  return (str || '').split('\n').flatMap((line, i, arr) =>
    i < arr.length - 1
      ? [new TextRun(line), new TextRun({ break: 1 })]
      : [new TextRun(line)]
  );
}

// ─── Per-format annotation renderers ─────────────────────────────────────────

function annToHtml(ann) {
  const raw = ann.text || '';
  const type = ann.type || 'unknown';
  switch (type) {
    case 'chapter-title':
      return `<h1 class="chapter-title">${escHtml(raw)}</h1>`;
    case 'section-title':
    case 'headline':
      return `<h2 class="section-title">${escHtml(raw)}</h2>`;
    case 'sub-section-title':
    case 'sub-headline':
      return `<h3 class="sub-section-title">${escHtml(raw)}</h3>`;
    case 'subsub-section-title':
    case 'subsub-headline':
      return `<h4 class="subsub-section-title">${escHtml(raw)}</h4>`;
    case 'table':
      return `<div class="table">${tableToHtml(raw)}</div>`;
    case 'quote':
      return `<div class="quote">${escHtml(raw)}</div>`;
    case 'ordered-list': {
      const items = raw.split('\n').filter(Boolean).map(l => `<li>${escHtml(l)}</li>`).join('\n');
      return `<ol class="ordered-list">${items}</ol>`;
    }
    case 'unordered-list': {
      const items = raw.split('\n').filter(Boolean).map(l => `<li>${escHtml(l)}</li>`).join('\n');
      return `<ul class="unordered-list">${items}</ul>`;
    }
    case 'header':
      return `<div class="header">${escHtml(raw)}</div>`;
    case 'footer':
      return `<div class="footer">${escHtml(raw)}</div>`;
    case 'sidebar':
      return `<div class="sidebar">${escHtml(raw)}</div>`;
    case 'footnote':
      return `<div class="footnote">${escHtml(raw)}</div>`;
    case 'paragraph':
    default:
      return `<p class="paragraph">${escHtml(raw)}</p>`;
  }
}

function annToMarkdown(ann) {
  const raw = ann.text || '';
  switch (ann.type) {
    case 'chapter-title':
      return `# ${raw}`;
    case 'section-title':
    case 'headline':
      return `## ${raw}`;
    case 'sub-section-title':
    case 'sub-headline':
      return `### ${raw}`;
    case 'subsub-section-title':
    case 'subsub-headline':
      return `#### ${raw}`;
    case 'table':
      return tableToMarkdown(raw);
    case 'quote':
      return raw.split('\n').map(l => `> ${l}`).join('\n');
    case 'ordered-list':
      return raw.split('\n').filter(Boolean).map((l, i) => `${i + 1}. ${l}`).join('\n');
    case 'unordered-list':
      return raw.split('\n').filter(Boolean).map(l => `- ${l}`).join('\n');
    default:
      return raw;
  }
}

function annToDocx(ann) {
  const raw = ann.text || '';
  switch (ann.type) {
    case 'title':
      return [new Paragraph({ text: raw, heading: HeadingLevel.HEADING_1 })];
    case 'heading':
      return [new Paragraph({ text: raw, heading: HeadingLevel.HEADING_2 })];
    case 'table':
      return [tableToDocx(raw), new Paragraph('')];
    case 'list':
      return raw.split('\n').filter(Boolean).map(l =>
        new Paragraph({ text: `• ${l}`, indent: { left: 720 } })
      );
    case 'caption':
      return [new Paragraph({
        children: [new TextRun({ text: raw, italics: true, size: 20 })],
      })];
    case 'figure':
    case 'image':
      return raw ? [new Paragraph({
        children: [new TextRun({ text: `[Figure] ${raw}`, italics: true, color: '6b7280' })],
      })] : [];
    default:
      return [new Paragraph({ children: textRuns(raw) })];
  }
}

// ─── Public export functions ──────────────────────────────────────────────────

/** Export all pages as JSON with a top-level envelope. */
export function exportJson(sessionId, pages, annotations, editedAnnotations, participant, activeSession, filename) {
  const exportedPages = pages.map((page, pageIndex) => {
    const anns = getPageAnnotations(annotations, editedAnnotations, sessionId, pageIndex, participant);
    const imgW = page.width || null;
    const imgH = page.height || null;
    return {
      page_num: pageIndex + 1,
      image_width: imgW,
      image_height: imgH,
      blocks: anns.map((ann, idx) => {
        const [x1, y1, x2, y2] = ann.box || [0, 0, 0, 0];
        const block = {
          block_id: ann.id,
          layout_tag: ann.type || 'unknown',
          reading_order: idx + 1,
          coordinates: { x1, y1, x2, y2 },
          bbox_normalized: imgW && imgH
            ? { x1: +(x1 / imgW).toFixed(4), y1: +(y1 / imgH).toFixed(4),
                x2: +(x2 / imgW).toFixed(4), y2: +(y2 / imgH).toFixed(4) }
            : null,
          confidence: ann.confidence ?? null,
          text: ann.text || '',
        };
        if (ann.type === 'table') {
          block.table_data = parseTableData(ann.text || '');
        }
        return block;
      }),
    };
  });

  const output = {
    export_version: '1.0',
    session_id: sessionId,
    source_filename: activeSession?.metadata?.source_filename || null,
    model: activeSession?.model_a?.display_name || null,
    created_at: activeSession?.created_at || null,
    exported_at: new Date().toISOString(),
    total_pages: pages.length,
    pages: exportedPages,
  };

  downloadText(JSON.stringify(output, null, 2), `${filename}.json`, 'application/json');
}

const HTML_CSS = `
body { padding: 0 !important; margin: 0 !important; background-color: white !important; width: 100% !important; font-family: serif; }
.page-body-container { background-color: white; width: 210mm; margin: 0 auto; padding: 20mm 15mm; box-sizing: border-box; min-height: 100vh; }
.page-break { border: none; border-top: 1px dashed #ccc; margin: 30px 0; }
p.paragraph, .paragraph { text-align: justify !important; text-align-last: left !important; font-size: 12pt !important; line-height: 1.3 !important; margin: 0 0 12pt 0 !important; text-indent: 18pt !important; width: 100% !important; box-sizing: border-box; }
h1.chapter-title { font-size: 30pt !important; line-height: 1.1 !important; margin: 0 0 12pt 0 !important; text-align: center !important; font-weight: bold; }
h2.section-title, h2.headline { font-size: 18pt !important; line-height: 1.1 !important; margin: 12pt 0 8pt 0 !important; text-align: center !important; font-weight: bold; }
h3.sub-section-title, h3.sub-headline { font-size: 13pt !important; line-height: 1.25 !important; margin: 12pt 0 4pt 0 !important; text-align: center !important; font-weight: bold; }
h4.subsub-section-title, h4.subsub-headline { font-size: 12pt !important; margin: 10pt 0 4pt 0 !important; text-align: center !important; font-weight: bold; }
.table table { width: 100% !important; margin: 18pt 0 !important; border-collapse: collapse; border: 1.5pt solid #333; table-layout: fixed; font-size: 11pt; line-height: 1.2; }
.table table td, .table table th { word-break: normal; overflow-wrap: break-word; padding: 6pt; border: 0.5pt solid #333; text-align: center; }
.table table td:first-child, .table table th:first-child { text-align: left; }
.quote { font-size: 13pt !important; padding: 0 20px !important; font-style: italic; border-left: 3px solid #ccc; margin-bottom: 12pt !important; }
.ordered-list, .unordered-list { font-size: 12pt !important; margin: 0 0 12pt 0 !important; padding-left: 40px !important; }
.sidebar { font-size: 12pt !important; margin: 12px auto; padding: 10px; background-color: #f5f5f5; }
.footnote { font-size: 10pt !important; margin: 8px auto; padding-left: 20px; }
.header, .footer { font-size: 13pt !important; margin: 12px auto; text-align: center; }
`;

/** Export all pages as a styled HTML document. */
export function exportHtml(sessionId, pages, annotations, editedAnnotations, participant, filename) {
  const bodies = pages.map((_page, pageIndex) => {
    const anns = getPageAnnotations(annotations, editedAnnotations, sessionId, pageIndex, participant);
    return anns.map(ann => annToHtml(ann)).join('\n');
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>${HTML_CSS}</style>
</head>
<body>
${bodies.map((body, i) => `<div class="page-body-container">\n${body}\n</div>${i < bodies.length - 1 ? '\n<hr class="page-break"/>' : ''}`).join('\n')}
</body>
</html>`;

  downloadText(html, `${filename}.html`, 'text/html');
}

/** Export all pages as Markdown. */
export function exportMarkdown(sessionId, pages, annotations, editedAnnotations, participant, filename) {
  const parts = pages.map((_page, pageIndex) => {
    const anns = getPageAnnotations(annotations, editedAnnotations, sessionId, pageIndex, participant);
    const header = pages.length > 1 && pageIndex > 0 ? `***\n\n` : '';
    return header + anns.map(ann => annToMarkdown(ann)).filter(Boolean).join('\n\n');
  });
  downloadText(parts.join('\n\n'), `${filename}.md`, 'text/markdown');
}

/** Export all pages as a DOCX file. */
export async function exportDocx(sessionId, pages, annotations, editedAnnotations, participant, filename) {
  const children = [];
  pages.forEach((_page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(new Paragraph({ text: '', pageBreakBefore: true }));
    }
    const anns = getPageAnnotations(annotations, editedAnnotations, sessionId, pageIndex, participant);
    anns.forEach(ann => {
      const nodes = annToDocx(ann);
      children.push(...nodes);
      children.push(new Paragraph({ text: '' }));
    });
  });

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${filename}.docx`);
}
