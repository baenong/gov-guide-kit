import { describe, it, expect, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkVariables } from '../src/plugins/remark-variables.mjs';

function render(markdown: string, variables: Record<string, string>): string {
  return unified()
    .use(remarkParse)
    .use(remarkVariables, variables)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('remarkVariables', () => {
  it('replaces a known variable reference with its value', () => {
    const html = render('등록 마감은 {{등록일}}까지입니다.', { 등록일: '2026-08-15' });
    expect(html).toContain('등록 마감은 2026-08-15까지입니다.');
  });

  it('trims whitespace inside the braces', () => {
    const html = render('마감: {{ 등록일 }}', { 등록일: '2026-08-15' });
    expect(html).toContain('마감: 2026-08-15');
  });

  it('replaces multiple references in the same text node', () => {
    const html = render('{{등록일}}부터 {{등록일}}까지', { 등록일: '2026-08-15' });
    expect(html).toContain('2026-08-15부터 2026-08-15까지');
  });

  it('leaves an unknown reference untouched and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = render('마감: {{없는변수}}', { 등록일: '2026-08-15' });
    expect(html).toContain('마감: {{없는변수}}');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not touch inline code content', () => {
    const html = render('코드: `{{등록일}}`', { 등록일: '2026-08-15' });
    expect(html).toContain('<code>{{등록일}}</code>');
  });
});
