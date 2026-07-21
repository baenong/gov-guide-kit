export const SNIPPETS = {
  h2: { before: '## ', after: '' },
  h3: { before: '### ', after: '' },
  notice: { before: ':::notice\n', after: '\n:::' },
  warning: { before: ':::warning\n', after: '\n:::' },
  calendar: { before: ':::calendar\n- YYYY-MM-DD: ', after: '\n:::' },
  orderedList: { before: '1. ', after: '' },
  unorderedList: { before: '- ', after: '' },
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
