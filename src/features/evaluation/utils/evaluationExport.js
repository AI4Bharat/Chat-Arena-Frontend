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

function pagesWithItems(session, pages, annotations) {
  return pages.map((page, i) => ({
    page: i + 1,
    image_path: page.path,
    width: page.width,
    height: page.height,
    annotations: annotations[`${session.id}_${i}`] || [],
  }));
}

export function exportEvaluationJson(session, pages, annotations, basename) {
  const payload = {
    session_id: session.id,
    title: session.title,
    model: session.model_a?.display_name || null,
    max_marks: session.metadata?.max_marks ?? null,
    source_filename: session.metadata?.source_filename || null,
    pages: pagesWithItems(session, pages, annotations),
  };
  download(`${basename}-evaluation.json`, 'application/json', JSON.stringify(payload, null, 2));
}

const csvCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per answer — a marks sheet a teacher can paste into a spreadsheet. */
export function exportEvaluationCsv(session, pages, annotations, basename) {
  const rows = [['page', 'question', 'marks_awarded', 'max_marks', 'category', 'comment', 'findings']];
  pagesWithItems(session, pages, annotations).forEach(({ page, annotations: items }) => {
    items.filter(a => a.kind === 'answer').forEach(answer => {
      const findings = items.filter(f => f.kind === 'finding' && f.answer_id === answer.id)
        .map(f => `[${categoryLabel(f.category)}] ${f.comment}`).join(' | ');
      rows.push([page, answer.question, answer.marks_awarded, answer.max_marks,
        categoryLabel(answer.category), answer.comment, findings]);
    });
  });
  download(`${basename}-marks.csv`, 'text/csv', rows.map(r => r.map(csvCell).join(',')).join('\n'));
}
