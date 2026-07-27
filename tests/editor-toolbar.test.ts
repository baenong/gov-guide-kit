import { describe, it, expect } from 'vitest';
import { insertAtCursor, insertBlockAtCursor, wrapSelection, SNIPPETS } from '../editor/public/toolbar.js';

function makeTextarea(value: string, cursorPos: number) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.selectionStart = cursorPos;
  textarea.selectionEnd = cursorPos;
  document.body.appendChild(textarea);
  return textarea;
}

describe('insertAtCursor', () => {
  it('inserts before/after text at the cursor and places the cursor between them', () => {
    const textarea = makeTextarea('안녕하세요', 2);
    insertAtCursor(textarea, '**', '**');
    expect(textarea.value).toBe('안녕****하세요');
    expect(textarea.selectionStart).toBe(4);
    expect(textarea.selectionEnd).toBe(4);
  });

  it('replaces a selection by wrapping it', () => {
    const textarea = makeTextarea('hello world', 0);
    textarea.selectionStart = 0;
    textarea.selectionEnd = 5;
    insertAtCursor(textarea, '**', '**');
    expect(textarea.value).toBe('**hello** world');
  });
});

describe('SNIPPETS', () => {
  it('defines a notice snippet', () => {
    expect(SNIPPETS.notice.before).toBe(':::notice\n');
    expect(SNIPPETS.notice.after).toBe('\n:::');
  });

  it('defines a calendar snippet with an example line', () => {
    expect(SNIPPETS.calendar.before).toContain(':::calendar');
    expect(SNIPPETS.calendar.before).toContain('- YYYY-MM-DD: ');
  });

  it('defines heading and warning snippets', () => {
    expect(SNIPPETS.h2.before).toBe('## ');
    expect(SNIPPETS.h3.before).toBe('### ');
    expect(SNIPPETS.warning.before).toBe(':::warning\n');
  });
});

describe('insertBlockAtCursor', () => {
  it('prepends a newline when the cursor is mid-line', () => {
    const textarea = makeTextarea('기존 문장', 5);
    insertBlockAtCursor(textarea, '## 제목', '');
    expect(textarea.value).toBe('기존 문장\n## 제목');
  });

  it('does not add an extra newline when the cursor is already at the start of a line', () => {
    const textarea = makeTextarea('첫 줄\n', 4);
    insertBlockAtCursor(textarea, '## 제목', '');
    expect(textarea.value).toBe('첫 줄\n## 제목');
  });

  it('does not add a newline at the very start of an empty textarea', () => {
    const textarea = makeTextarea('', 0);
    insertBlockAtCursor(textarea, '## 제목', '');
    expect(textarea.value).toBe('## 제목');
  });
});

describe('wrapSelection', () => {
  it('wraps a selection with a colored span', () => {
    const textarea = makeTextarea('안녕하세요', 0);
    textarea.selectionStart = 0;
    textarea.selectionEnd = 2;
    wrapSelection(textarea, '#DE3412');
    expect(textarea.value).toBe('<span style="color: #DE3412">안녕</span>하세요');
  });

  it('inserts a placeholder and selects it when there is no selection', () => {
    const textarea = makeTextarea('시작', 2);
    wrapSelection(textarea, '#018FD7');
    expect(textarea.value).toBe('시작<span style="color: #018FD7">내용</span>');
    const before = '<span style="color: #018FD7">';
    expect(textarea.selectionStart).toBe(2 + before.length);
    expect(textarea.selectionEnd).toBe(2 + before.length + 2);
    expect(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)).toBe('내용');
  });
});
