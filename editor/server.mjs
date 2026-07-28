import http from 'node:http';
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exec, spawn } from 'node:child_process';
import { parseFrontmatter, serializeFrontmatter } from './lib/frontmatter.mjs';
import { uniqueSlug } from './lib/slug.mjs';

const EDITOR_DIR = path.dirname(fileURLToPath(import.meta.url));

export function parseLocalPort(text) {
  const match = text.match(/localhost:(\d+)/);
  return match ? Number(match[1]) : null;
}

const STATIC_FILES = {
  '/': { file: 'public/index.html', type: 'text/html; charset=utf-8' },
  '/style.css': { file: 'public/style.css', type: 'text/css; charset=utf-8' },
  '/app.js': { file: 'public/app.js', type: 'text/javascript; charset=utf-8' },
  '/api-client.js': { file: 'public/api-client.js', type: 'text/javascript; charset=utf-8' },
  '/toolbar.js': { file: 'public/toolbar.js', type: 'text/javascript; charset=utf-8' },
  '/table-builder.js': { file: 'public/table-builder.js', type: 'text/javascript; charset=utf-8' },
};

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

export function createServer(projectRoot, previewPortState = { port: null }) {
  const guideDir = path.join(projectRoot, 'src/content/guide');
  const configPath = path.join(projectRoot, 'site.config.json');
  const variablesPath = path.join(projectRoot, 'site.variables.json');
  const imagesDir = path.join(projectRoot, 'public/assets/images');
  const filesDir = path.join(projectRoot, 'public/assets/files');

  async function listPageFiles() {
    return (await readdir(guideDir)).filter((f) => f.endsWith('.md'));
  }

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');

      if (req.method === 'GET' && STATIC_FILES[url.pathname]) {
        const entry = STATIC_FILES[url.pathname];
        const content = await readFile(path.join(EDITOR_DIR, entry.file));
        res.writeHead(200, { 'Content-Type': entry.type });
        res.end(content);
        return;
      }

      if (url.pathname === '/api/pages' && req.method === 'GET') {
        const files = await listPageFiles();
        const pages = [];
        for (const file of files) {
          const raw = await readFile(path.join(guideDir, file), 'utf-8');
          const { title, order, description } = parseFrontmatter(raw);
          pages.push({ slug: file.replace(/\.md$/, ''), title, order, description });
        }
        pages.sort((a, b) => a.order - b.order);
        return sendJson(res, 200, pages);
      }

      const pageMatch = url.pathname.match(/^\/api\/pages\/([^/]+)$/);
      if (pageMatch && req.method === 'GET') {
        const slug = decodeURIComponent(pageMatch[1]);
        const filePath = path.join(guideDir, `${slug}.md`);
        let raw;
        try {
          raw = await readFile(filePath, 'utf-8');
        } catch {
          return sendJson(res, 404, { error: `페이지를 찾을 수 없습니다: ${slug}` });
        }
        const { title, order, description, body } = parseFrontmatter(raw);
        return sendJson(res, 200, { slug, title, order, description, body });
      }

      if (pageMatch && req.method === 'PUT') {
        const slug = decodeURIComponent(pageMatch[1]);
        const filePath = path.join(guideDir, `${slug}.md`);
        const existingRaw = await readFile(filePath, 'utf-8');
        const existing = parseFrontmatter(existingRaw);
        const { title, description, body } = await readJsonBody(req);
        const nextRaw = serializeFrontmatter(
          { title, order: existing.order, description },
          body ?? '',
        );
        await writeFile(filePath, nextRaw, 'utf-8');
        return sendJson(res, 200, { slug, title, order: existing.order, description, body });
      }

      if (url.pathname === '/api/pages' && req.method === 'POST') {
        const { title } = await readJsonBody(req);
        if (!title) {
          return sendJson(res, 400, { error: 'title은 필수입니다.' });
        }
        const files = await listPageFiles();
        const existingSlugs = files.map((f) => f.replace(/\.md$/, ''));
        const slug = uniqueSlug(title, existingSlugs);

        let maxOrder = 0;
        for (const file of files) {
          const raw = await readFile(path.join(guideDir, file), 'utf-8');
          maxOrder = Math.max(maxOrder, parseFrontmatter(raw).order);
        }

        const order = maxOrder + 1;
        const raw = serializeFrontmatter({ title, order }, '');
        await writeFile(path.join(guideDir, `${slug}.md`), raw, 'utf-8');
        return sendJson(res, 201, { slug, title, order, body: '' });
      }

      if (pageMatch && req.method === 'DELETE') {
        const slug = decodeURIComponent(pageMatch[1]);
        if (slug === 'index') {
          return sendJson(res, 400, { error: '메인 페이지는 삭제할 수 없습니다.' });
        }
        await unlink(path.join(guideDir, `${slug}.md`));
        return sendJson(res, 200, { ok: true });
      }

      if (url.pathname === '/api/reorder' && req.method === 'PUT') {
        const { order } = await readJsonBody(req);
        for (const item of order) {
          const filePath = path.join(guideDir, `${item.slug}.md`);
          const raw = await readFile(filePath, 'utf-8');
          const parsed = parseFrontmatter(raw);
          const nextRaw = serializeFrontmatter(
            { title: parsed.title, order: item.order, description: parsed.description },
            parsed.body,
          );
          await writeFile(filePath, nextRaw, 'utf-8');
        }
        return sendJson(res, 200, { ok: true });
      }

      if (url.pathname === '/api/config' && req.method === 'GET') {
        const raw = await readFile(configPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(raw);
        return;
      }

      if (url.pathname === '/api/config' && req.method === 'PUT') {
        const body = await readJsonBody(req);
        await writeFile(configPath, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
        return sendJson(res, 200, body);
      }

      if (url.pathname === '/api/variables' && req.method === 'GET') {
        const raw = await readFile(variablesPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(raw);
        return;
      }

      if (url.pathname === '/api/variables' && req.method === 'PUT') {
        const body = await readJsonBody(req);
        await writeFile(variablesPath, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
        return sendJson(res, 200, body);
      }

      if (url.pathname === '/api/upload' && req.method === 'POST') {
        const { filename, dataBase64, kind } = await readJsonBody(req);
        if (!filename || !dataBase64 || (kind !== 'image' && kind !== 'file')) {
          return sendJson(res, 400, { error: 'filename, dataBase64, kind(image|file)이 필요합니다.' });
        }
        const targetDir = kind === 'image' ? imagesDir : filesDir;
        const publicSubdir = kind === 'image' ? 'images' : 'files';
        await mkdir(targetDir, { recursive: true });
        const safeName = filename.replace(/[\\/]/g, '_').replace(/\s+/g, '-');
        await writeFile(path.join(targetDir, safeName), Buffer.from(dataBase64, 'base64'));
        return sendJson(res, 201, { path: `/assets/${publicSubdir}/${safeName}` });
      }

      if (url.pathname === '/api/preview-port' && req.method === 'GET') {
        return sendJson(res, 200, { port: previewPortState.port });
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });
}

const PORT = 4322;

function openBrowser(url) {
  const commands = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
  };
  const command = commands[process.platform] ?? `xdg-open "${url}"`;
  exec(command, () => {});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const projectRoot = process.cwd();
  const previewPortState = { port: null };

  console.log('[editor] astro dev를 함께 시작합니다...');
  // A single command string (no separate args array) run through the shell —
  // Windows needs a shell to resolve npm.cmd, and passing args separately
  // alongside shell: true is what triggers Node's escaping-related deprecation
  // warning, which a single pre-composed string avoids entirely.
  const devProcess = spawn('npm run dev', {
    cwd: projectRoot,
    shell: true,
  });
  devProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(`[astro] ${text}`);
    const port = parseLocalPort(text);
    if (port) previewPortState.port = port;
  });
  devProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[astro] ${chunk}`);
  });

  const server = createServer(projectRoot, previewPortState);
  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`[editor] ${url} 에서 실행 중입니다.`);
    openBrowser(url);
  });

  process.on('SIGINT', () => {
    devProcess.kill();
    process.exit(0);
  });
}
