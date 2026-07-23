import { describe, it, expect } from 'vitest';
import { isValidVariableKey } from '../editor/public/app.js';

describe('isValidVariableKey', () => {
  it('accepts a normal Korean key', () => {
    expect(isValidVariableKey('등록일')).toBe(true);
  });

  it('rejects an empty or whitespace-only key', () => {
    expect(isValidVariableKey('')).toBe(false);
    expect(isValidVariableKey('   ')).toBe(false);
  });

  it('rejects a key containing the reference syntax', () => {
    expect(isValidVariableKey('등록{{일')).toBe(false);
    expect(isValidVariableKey('등록일}}')).toBe(false);
  });

  it('rejects a key containing a newline', () => {
    expect(isValidVariableKey('등록\n일')).toBe(false);
  });
});
