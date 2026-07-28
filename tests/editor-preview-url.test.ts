import { describe, it, expect } from 'vitest';
import { previewUrlFor } from '../editor/public/app.js';

describe('previewUrlFor', () => {
  it('returns null when the preview port is not known yet', () => {
    expect(previewUrlFor('sample', null)).toBeNull();
  });

  it('points the index page at the site root', () => {
    expect(previewUrlFor('index', 4321)).toBe('http://localhost:4321/');
  });

  it('points other pages at /guide/{slug}', () => {
    expect(previewUrlFor('sample', 4321)).toBe('http://localhost:4321/guide/sample');
  });
});
