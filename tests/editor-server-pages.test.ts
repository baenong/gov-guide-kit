// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../editor/server.mjs';

let tmpRoot: string;
let server: ReturnType<typeof createServer>;
let baseUrl: string;

async function seedFixture() {
  const guideDir = path.join(tmpRoot, 'src/content/guide');
  await mkdir(guideDir, { recursive: true });
  await writeFile(
    path.join(guideDir, 'index.md'),
    '---\ntitle: 메인\norder: 0\n---\n\n메인 본문\n',
    'utf-8',
  );
  await writeFile(
    path.join(guideDir, 'sample.md'),
    '---\ntitle: 예시\norder: 1\n---\n\n예시 본문\n',
    'utf-8',
  );
  await writeFile(
    path.join(tmpRoot, 'site.config.json'),
    JSON.stringify({ orgName: '테스트기관', colors: { primary: '#000', secondary: '#000', accent: '#000' }, logoPath: '/assets/logo.svg' }),
    'utf-8',
  );
}

beforeEach(async () => {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'editor-test-'));
  await seedFixture();
  server = createServer(tmpRoot);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(tmpRoot, { recursive: true, force: true });
});

describe('GET /api/pages', () => {
  it('returns pages sorted by order', async () => {
    const res = await fetch(`${baseUrl}/api/pages`);
    expect(res.status).toBe(200);
    const pages = await res.json();
    expect(pages).toEqual([
      { slug: 'index', title: '메인', order: 0, description: undefined },
      { slug: 'sample', title: '예시', order: 1, description: undefined },
    ]);
  });
});

describe('GET /api/pages/:slug', () => {
  it('returns a single page including its body', async () => {
    const res = await fetch(`${baseUrl}/api/pages/sample`);
    expect(res.status).toBe(200);
    const page = await res.json();
    expect(page.title).toBe('예시');
    expect(page.body.trim()).toBe('예시 본문');
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await fetch(`${baseUrl}/api/pages/nope`);
    expect(res.status).toBe(404);
  });

  it('resolves a URL-encoded Korean slug (e.g. as produced by encodeURIComponent in the client)', async () => {
    await mkdir(path.join(tmpRoot, 'src/content/guide'), { recursive: true });
    await writeFile(
      path.join(tmpRoot, 'src/content/guide/한글-슬러그.md'),
      '---\ntitle: 한글 슬러그 페이지\norder: 2\n---\n\n본문\n',
      'utf-8',
    );
    const res = await fetch(`${baseUrl}/api/pages/${encodeURIComponent('한글-슬러그')}`);
    expect(res.status).toBe(200);
    const page = await res.json();
    expect(page.title).toBe('한글 슬러그 페이지');
  });
});

describe('PUT /api/pages/:slug', () => {
  it('updates title/description/body while preserving order', async () => {
    const res = await fetch(`${baseUrl}/api/pages/sample`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '수정된 예시', description: '새 설명', body: '수정된 본문' }),
    });
    expect(res.status).toBe(200);

    const raw = await readFile(path.join(tmpRoot, 'src/content/guide/sample.md'), 'utf-8');
    expect(raw).toContain('title: 수정된 예시');
    expect(raw).toContain('order: 1');
    expect(raw).toContain('description: 새 설명');
    expect(raw).toContain('수정된 본문');
  });
});

describe('GET/PUT /api/config', () => {
  it('reads the seeded config', async () => {
    const res = await fetch(`${baseUrl}/api/config`);
    expect(res.status).toBe(200);
    const config = await res.json();
    expect(config.orgName).toBe('테스트기관');
  });

  it('writes an updated config', async () => {
    const res = await fetch(`${baseUrl}/api/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName: '새기관명', colors: { primary: '#111', secondary: '#222', accent: '#333' }, logoPath: '/assets/logo.svg' }),
    });
    expect(res.status).toBe(200);
    const raw = await readFile(path.join(tmpRoot, 'site.config.json'), 'utf-8');
    expect(JSON.parse(raw).orgName).toBe('새기관명');
  });
});
