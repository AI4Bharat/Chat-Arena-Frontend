import { categoryLabel } from './evaluationCategories';

function download(filename, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportEvaluationJson(session, pages, items, basename) {
  const payload = {
    session_id: session.id,
    title: session.title,
    model: session.model_a?.display_name || null,
    max_marks: session.metadata?.max_marks ?? null,
    source_filename: session.metadata?.source_filename || null,
    pages: pages.map((page, i) => ({ page: i + 1, image_path: page.path, width: page.width, height: page.height })),
    annotations: items,
  };
  download(`${basename}-evaluation.json`, 'application/json', JSON.stringify(payload, null, 2));
}

const csvCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per question (however many boxes and pages its answer spans) — a marks sheet. */
export function exportEvaluationCsv(session, pages, items, basename) {
  const rows = [['question', 'pages', 'marks_awarded', 'max_marks', 'category', 'comment', 'findings']];
  items.filter(a => a.kind === 'answer').forEach(answer => {
    const answerPages = [...new Set((answer.parts || []).map(p => p.page))].sort((a, b) => a - b);
    const findings = items.filter(f => f.kind === 'finding' && f.answer_id === answer.id)
      .map(f => `[p.${f.page} ${categoryLabel(f.category)}] ${f.comment}`).join(' | ');
    rows.push([answer.question, answerPages.join(' '), answer.marks_awarded, answer.max_marks,
      categoryLabel(answer.category), answer.comment, findings]);
  });
  download(`${basename}-marks.csv`, 'text/csv', rows.map(r => r.map(csvCell).join(',')).join('\n'));
}
