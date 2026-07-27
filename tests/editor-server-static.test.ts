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

describe('static file serving', () => {
  it('serves every local module that app.js imports (regression: a new module must be registered in STATIC_FILES)', async () => {
    const appJs = await readFile(
      path.join('editor', 'public', 'app.js'),
      'utf-8',
    );
    const importPaths = [...appJs.matchAll(/from '(\.\/[^']+\.js)'/g)].map(
      (match) => match[1].replace(/^\./, ''),
    );

    expect(importPaths.length).toBeGreaterThan(0);

    for (const importPath of importPaths) {
      const res = await fetch(`${baseUrl}${importPath}`);
      expect(res.status, `expected ${importPath} to be served`).toBe(200);
    }
  });
});
