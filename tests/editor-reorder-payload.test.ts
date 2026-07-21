import { describe, it, expect } from 'vitest';
import { computeReorderPayload } from '../editor/public/app.js';

describe('computeReorderPayload', () => {
  it('assigns sequential order starting at 0 following the given slug order', () => {
    expect(computeReorderPayload(['sample', 'index', 'faq'])).toEqual([
      { slug: 'sample', order: 0 },
      { slug: 'index', order: 1 },
      { slug: 'faq', order: 2 },
    ]);
  });

  it('returns an empty array for an empty list', () => {
    expect(computeReorderPayload([])).toEqual([]);
  });
});
