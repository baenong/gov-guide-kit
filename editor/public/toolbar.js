export const SNIPPETS = {
  h2: { before: '## ', after: '' },
  h3: { before: '### ', after: '' },
  notice: { before: ':::notice\n', after: '\n:::' },
  warning: { before: ':::warning\n', after: '\n:::' },
  calendar: { before: ':::calendar\n- YYYY-MM-DD: ', after: '\n:::' },
};

export function insertAtCursor(textarea, before, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + before.length + selected.length;
  textarea.selectionStart = cursor;
  textarea.selectionEnd = cursor;
  textarea.focus();
}

/**
 * Same as insertAtCursor, but forces the snippet onto its own new line
 * first (unless the cursor is already at the start of a line). Used for
 * block-level snippets (headings, callouts, calendar) — page links are
 * the one exception that stays inline, since a link can appear mid-sentence.
 */
export function insertBlockAtCursor(textarea, before, after) {
  const start = textarea.selectionStart;
  const needsNewline = start > 0 && textarea.value[start - 1] !== '\n';
  insertAtCursor(textarea, (needsNewline ? '\n' : '') + before, after);
}
