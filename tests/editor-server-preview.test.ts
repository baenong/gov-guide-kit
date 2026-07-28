// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, parseLocalPort } from '../editor/server.mjs';

describe('parseLocalPort', () => {
  it('extracts the port from an Astro "Local" startup line', () => {
    expect(parseLocalPort('┃ Local    http://localhost:4321/\n')).toBe(4321);
  });

  it('extracts the port even when Astro falls back to a different port', () => {
    expect(parseLocalPort('┃ Local    http://localhost:4325/\n')).toBe(4325);
  });

  it('returns null when the text has no localhost URL', () => {
    expect(parseLocalPort('Port 4321 is in use, trying another one...')).toBeNull();
  });
});

let tmpRoot: string;
let server: ReturnType<typeof createServer>;
let baseUrl: string;
let previewPortState: { port: number | null };

beforeEach(async () => {
  tmpRoot = await mkdtemp(path.join(tmpdir(), 'editor-test-'));
  await mkdir(path.join(tmpRoot, 'src/content/guide'), { recursive: true });
  await writeFile(path.join(tmpRoot, 'site.config.json'), '{}', 'utf-8');

  previewPortState = { port: null };
  server = createServer(tmpRoot, previewPortState);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(tmpRoot, { recursive: true, force: true });
});

describe('GET /api/preview-port', () => {
  it('returns null while the preview dev server has not been detected yet', async () => {
    const res = await fetch(`${baseUrl}/api/preview-port`);
    const body = await res.json();
    expect(body).toEqual({ port: null });
  });

  it('returns the discovered port once set', async () => {
    previewPortState.port = 4321;
    const res = await fetch(`${baseUrl}/api/preview-port`);
    const body = await res.json();
    expect(body).toEqual({ port: 4321 });
  });
});
