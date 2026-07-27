import { describe, it, expect } from 'vitest';
import {
  createTableState,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  setCell,
  toMarkdownTable,
} from '../editor/public/table-builder.js';

describe('createTableState', () => {
  it('creates a grid of the given size filled with empty strings', () => {
    const state = createTableState(2, 3);
    expect(state).toEqual([
      ['', '', ''],
      ['', '', ''],
    ]);
  });
});

describe('addRow', () => {
  it('appends an empty row matching the existing column count', () => {
    const state = [['a', 'b']];
    const next = addRow(state);
    expect(next).toEqual([
      ['a', 'b'],
      ['', ''],
    ]);
  });

  it('does not mutate the original state', () => {
    const state = [['a', 'b']];
    addRow(state);
    expect(state).toEqual([['a', 'b']]);
  });
});

describe('removeRow', () => {
  it('removes the row at the given index', () => {
    const state = [['a'], ['b'], ['c']];
    expect(removeRow(state, 1)).toEqual([['a'], ['c']]);
  });

  it('refuses to remove the last remaining row', () => {
    const state = [['a']];
    expect(removeRow(state, 0)).toEqual([['a']]);
  });
});

describe('addColumn', () => {
  it('appends an empty cell to every row', () => {
    const state = [['a'], ['b']];
    expect(addColumn(state)).toEqual([
      ['a', ''],
      ['b', ''],
    ]);
  });
});

describe('removeColumn', () => {
  it('removes the column at the given index from every row', () => {
    const state = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ];
    expect(removeColumn(state, 1)).toEqual([
      ['a', 'c'],
      ['d', 'f'],
    ]);
  });

  it('refuses to remove the last remaining column', () => {
    const state = [['a'], ['b']];
    expect(removeColumn(state, 0)).toEqual([['a'], ['b']]);
  });
});

describe('setCell', () => {
  it('replaces the value at the given cell', () => {
    const state = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    expect(setCell(state, 1, 0, 'z')).toEqual([
      ['a', 'b'],
      ['z', 'd'],
    ]);
  });

  it('does not mutate the original state', () => {
    const state = [['a', 'b']];
    setCell(state, 0, 0, 'z');
    expect(state).toEqual([['a', 'b']]);
  });
});

describe('toMarkdownTable', () => {
  it('renders a header row, separator, and body rows', () => {
    const state = [
      ['이름', '나이'],
      ['홍길동', '30'],
    ];
    expect(toMarkdownTable(state)).toBe(
      '| 이름 | 나이 |\n| --- | --- |\n| 홍길동 | 30 |',
    );
  });

  it('escapes pipe characters in cell content', () => {
    const state = [['a|b', 'c']];
    expect(toMarkdownTable(state)).toBe('| a\\|b | c |\n| --- | --- |');
  });

  it('replaces newlines in cell content with a space', () => {
    const state = [['line1\nline2', 'c']];
    expect(toMarkdownTable(state)).toBe('| line1 line2 | c |\n| --- | --- |');
  });
});
