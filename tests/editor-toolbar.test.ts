import { describe, it, expect } from 'vitest';
import { insertAtCursor, SNIPPETS } from '../editor/public/toolbar.js';

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

  it('defines heading, list, and warning snippets', () => {
    expect(SNIPPETS.h2.before).toBe('## ');
    expect(SNIPPETS.h3.before).toBe('### ');
    expect(SNIPPETS.warning.before).toBe(':::warning\n');
    expect(SNIPPETS.orderedList.before).toBe('1. ');
    expect(SNIPPETS.unorderedList.before).toBe('- ');
  });
});
