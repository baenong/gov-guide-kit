// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../editor/server.mjs';

let tmpRoot: string;
let server: ReturnType<typeof createServer>;
let baseUrl: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'editor-test-'));
  const guideDir = path.join(tmpRoot, 'src/content/guide');
  await mkdir(guideDir, { recursive: true });
  await writeFile(path.join(guideDir, 'index.md'), '---\ntitle: 메인\norder: 0\n---\n\n본문\n', 'utf-8');
  await writeFile(path.join(guideDir, 'sample.md'), '---\ntitle: 예시\norder: 1\n---\n\n본문\n', 'utf-8');
  await writeFile(path.join(tmpRoot, 'site.config.json'), '{}', 'utf-8');

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

describe('POST /api/pages', () => {
  it('creates a new page appended after the current max order', async () => {
    const res = await fetch(`${baseUrl}/api/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '새 페이지' }),
    });
    expect(res.status).toBe(201);
    const page = await res.json();
    expect(page.order).toBe(2);
    expect(page.slug).toBe('새-페이지');

    const files = await readdir(path.join(tmpRoot, 'src/content/guide'));
    expect(files).toContain('새-페이지.md');
  });

  it('rejects a request without a title', async () => {
    const res = await fetch(`${baseUrl}/api/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/pages/:slug', () => {
  it('deletes a non-index page', async () => {
    const res = await fetch(`${baseUrl}/api/pages/sample`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    const files = await readdir(path.join(tmpRoot, 'src/content/guide'));
    expect(files).not.toContain('sample.md');
  });

  it('refuses to delete the index page', async () => {
    const res = await fetch(`${baseUrl}/api/pages/index`, { method: 'DELETE' });
    expect(res.status).toBe(400);
    const files = await readdir(path.join(tmpRoot, 'src/content/guide'));
    expect(files).toContain('index.md');
  });
});

describe('PUT /api/reorder', () => {
  it('rewrites the order field of every listed page', async () => {
    const res = await fetch(`${baseUrl}/api/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: [{ slug: 'sample', order: 0 }, { slug: 'index', order: 1 }] }),
    });
    expect(res.status).toBe(200);

    const sampleRaw = await readFile(path.join(tmpRoot, 'src/content/guide/sample.md'), 'utf-8');
    const indexRaw = await readFile(path.join(tmpRoot, 'src/content/guide/index.md'), 'utf-8');
    expect(sampleRaw).toContain('order: 0');
    expect(indexRaw).toContain('order: 1');
  });
});
