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

describe('POST /api/upload', () => {
  it('writes an image to public/assets/images and returns its root-absolute path', async () => {
    const dataBase64 = Buffer.from('fake-png-bytes').toString('base64');
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'photo.png', dataBase64, kind: 'image' }),
    });
    expect(res.status).toBe(201);
    const { path: resultPath } = await res.json();
    expect(resultPath).toBe('/assets/images/photo.png');

    const written = await readFile(path.join(tmpRoot, 'public/assets/images/photo.png'));
    expect(written.toString()).toBe('fake-png-bytes');
  });

  it('writes a document to public/assets/files', async () => {
    const dataBase64 = Buffer.from('fake-pdf-bytes').toString('base64');
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'form.pdf', dataBase64, kind: 'file' }),
    });
    const { path: resultPath } = await res.json();
    expect(resultPath).toBe('/assets/files/form.pdf');
  });

  it('rejects a request missing required fields', async () => {
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'x.png' }),
    });
    expect(res.status).toBe(400);
  });

  it('sanitizes path separators out of the filename', async () => {
    const dataBase64 = Buffer.from('data').toString('base64');
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: '../../evil.png', dataBase64, kind: 'image' }),
    });
    const { path: resultPath } = await res.json();
    expect(resultPath).toBe('/assets/images/.._.._evil.png');
  });
});
