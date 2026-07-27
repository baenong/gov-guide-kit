export function createTableState(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

export function addRow(state) {
  const cols = state[0].length;
  return [...state, Array.from({ length: cols }, () => '')];
}

export function removeRow(state, rowIndex) {
  if (state.length <= 1) return state;
  return state.filter((_, i) => i !== rowIndex);
}

export function addColumn(state) {
  return state.map((row) => [...row, '']);
}

export function removeColumn(state, colIndex) {
  if (state[0].length <= 1) return state;
  return state.map((row) => row.filter((_, i) => i !== colIndex));
}

export function setCell(state, rowIndex, colIndex, value) {
  return state.map((row, r) =>
    r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
  );
}

function escapeCell(value) {
  return value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}

export function toMarkdownTable(state) {
  const [header, ...body] = state;
  const rowToLine = (row) => `| ${row.map(escapeCell).join(' | ')} |`;
  const separator = `| ${header.map(() => '---').join(' | ')} |`;
  return [rowToLine(header), separator, ...body.map(rowToLine)].join('\n');
}
