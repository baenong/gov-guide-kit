// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, serializeFrontmatter } from '../editor/lib/frontmatter.mjs';

describe('parseFrontmatter', () => {
  it('parses title, order, and body', () => {
    const raw = '---\ntitle: 예시 안내 페이지\norder: 1\n---\n\n## 준비 서류\n';
    const result = parseFrontmatter(raw);
    expect(result.title).toBe('예시 안내 페이지');
    expect(result.order).toBe(1);
    expect(result.description).toBeUndefined();
    expect(result.body).toBe('## 준비 서류\n');
  });

  it('parses an optional description', () => {
    const raw = '---\ntitle: 메인\norder: 0\ndescription: 설명입니다\n---\n\n본문\n';
    const result = parseFrontmatter(raw);
    expect(result.description).toBe('설명입니다');
  });

  it('keeps a colon that appears inside the title value', () => {
    const raw = '---\ntitle: 안내: 등록 절차\norder: 2\n---\n\n본문\n';
    const result = parseFrontmatter(raw);
    expect(result.title).toBe('안내: 등록 절차');
  });

  it('throws when the front matter block is missing', () => {
    expect(() => parseFrontmatter('그냥 본문입니다')).toThrow();
  });

  it('throws when title is missing', () => {
    expect(() => parseFrontmatter('---\norder: 1\n---\n\n본문\n')).toThrow();
  });

  it('throws when order is missing or non-numeric', () => {
    expect(() => parseFrontmatter('---\ntitle: 제목\norder: 하나\n---\n\n본문\n')).toThrow();
  });
});

describe('serializeFrontmatter', () => {
  it('round-trips title/order/description and body', () => {
    const raw = serializeFrontmatter({ title: '메인', order: 0, description: '설명' }, '본문 내용');
    const parsed = parseFrontmatter(raw);
    expect(parsed.title).toBe('메인');
    expect(parsed.order).toBe(0);
    expect(parsed.description).toBe('설명');
    expect(parsed.body.trim()).toBe('본문 내용');
  });

  it('omits the description line when not provided', () => {
    const raw = serializeFrontmatter({ title: '메인', order: 0 }, '본문');
    expect(raw).not.toContain('description:');
  });
});
