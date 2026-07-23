// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../editor/server.mjs';

let tmpRoot: string;
let server: ReturnType<typeof createServer>;
let baseUrl: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'editor-test-'));
  await mkdir(path.join(tmpRoot, 'src/content/guide'), { recursive: true });
  await writeFile(path.join(tmpRoot, 'site.config.json'), '{}', 'utf-8');
  await writeFile(path.join(tmpRoot, 'site.variables.json'), JSON.stringify({ 등록일: '2026-08-15' }), 'utf-8');

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

describe('GET /api/variables', () => {
  it('returns the seeded variables', async () => {
    const res = await fetch(`${baseUrl}/api/variables`);
    expect(res.status).toBe(200);
    const variables = await res.json();
    expect(variables).toEqual({ 등록일: '2026-08-15' });
  });
});

describe('PUT /api/variables', () => {
  it('overwrites the variables file', async () => {
    const res = await fetch(`${baseUrl}/api/variables`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 등록일: '2026-09-01', 문의처: '063-000-0000' }),
    });
    expect(res.status).toBe(200);
    const raw = await readFile(path.join(tmpRoot, 'site.variables.json'), 'utf-8');
    expect(JSON.parse(raw)).toEqual({ 등록일: '2026-09-01', 문의처: '063-000-0000' });
  });
});
