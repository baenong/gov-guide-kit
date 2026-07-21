import { describe, it, expect } from 'vitest';
import { guideSchema } from '../src/content/schema';

describe('guide content schema', () => {
  it('accepts valid front matter', () => {
    expect(() =>
      guideSchema.parse({ title: '임용등록 안내', order: 1 }),
    ).not.toThrow();
  });

  it('rejects a non-numeric order field', () => {
    expect(() =>
      guideSchema.parse({ title: '임용등록 안내', order: '일' }),
    ).toThrow();
  });

  it('rejects missing title', () => {
    expect(() => guideSchema.parse({ order: 1 })).toThrow();
  });
});
