import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkVariables } from '../src/plugins/remark-variables.mjs';

let tmpRoot: string;
let variablesPath: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'remark-variables-test-'));
  variablesPath = path.join(tmpRoot, 'site.variables.json');
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function render(markdown: string, variables: Record<string, string>): Promise<string> {
  await writeFile(variablesPath, JSON.stringify(variables), 'utf-8');
  return unified()
    .use(remarkParse)
    .use(remarkVariables, variablesPath)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('remarkVariables', () => {
  it('replaces a known variable reference with its value', async () => {
    const html = await render('등록 마감은 {{등록일}}까지입니다.', { 등록일: '2026-08-15' });
    expect(html).toContain('등록 마감은 2026-08-15까지입니다.');
  });

  it('trims whitespace inside the braces', async () => {
    const html = await render('마감: {{ 등록일 }}', { 등록일: '2026-08-15' });
    expect(html).toContain('마감: 2026-08-15');
  });

  it('replaces multiple references in the same text node', async () => {
    const html = await render('{{등록일}}부터 {{등록일}}까지', { 등록일: '2026-08-15' });
    expect(html).toContain('2026-08-15부터 2026-08-15까지');
  });

  it('leaves an unknown reference untouched and warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const html = await render('마감: {{없는변수}}', { 등록일: '2026-08-15' });
    expect(html).toContain('마감: {{없는변수}}');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not touch inline code content', async () => {
    const html = await render('코드: `{{등록일}}`', { 등록일: '2026-08-15' });
    expect(html).toContain('<code>{{등록일}}</code>');
  });

  it('re-reads the variables file on every transform, picking up changes without restarting', async () => {
    await writeFile(variablesPath, JSON.stringify({ 등록일: '2026-08-15' }), 'utf-8');
    const pipeline = unified()
      .use(remarkParse)
      .use(remarkVariables, variablesPath)
      .use(remarkRehype)
      .use(rehypeStringify);

    const first = pipeline.processSync('마감: {{등록일}}').toString();
    expect(first).toContain('마감: 2026-08-15');

    await writeFile(variablesPath, JSON.stringify({ 등록일: '2026-09-01' }), 'utf-8');
    const second = pipeline.processSync('마감: {{등록일}}').toString();
    expect(second).toContain('마감: 2026-09-01');
  });
});
