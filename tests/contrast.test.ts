import { describe, it, expect } from 'vitest';
import { contrastRatio, meetsAA } from '../src/lib/contrast';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#1A2D65', '#1A2D65')).toBeCloseTo(1, 5);
  });
});

describe('meetsAA', () => {
  it('passes for a dark navy on white', () => {
    expect(meetsAA('#1A2D65', '#FFFFFF')).toBe(true);
  });

  it('fails for a light gray on white', () => {
    expect(meetsAA('#CCCCCC', '#FFFFFF')).toBe(false);
  });
});
