// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from '../editor/lib/slug.mjs';

describe('slugify', () => {
  it('lowercases and hyphenates an English title', () => {
    expect(slugify('New Registration Guide')).toBe('new-registration-guide');
  });

  it('keeps Korean characters', () => {
    expect(slugify('임용등록 안내')).toBe('임용등록-안내');
  });

  it('falls back to "page" for an empty result', () => {
    expect(slugify('!!!')).toBe('page');
  });
});

describe('uniqueSlug', () => {
  it('returns the plain slug when there is no collision', () => {
    expect(uniqueSlug('새 페이지', ['index', 'sample'])).toBe('새-페이지');
  });

  it('appends a numeric suffix on collision', () => {
    expect(uniqueSlug('예시 안내 페이지', ['index', '예시-안내-페이지'])).toBe('예시-안내-페이지-2');
  });

  it('keeps incrementing past multiple collisions', () => {
    const existing = ['index', '예시-안내-페이지', '예시-안내-페이지-2'];
    expect(uniqueSlug('예시 안내 페이지', existing)).toBe('예시-안내-페이지-3');
  });
});
