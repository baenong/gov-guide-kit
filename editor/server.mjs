import http from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exec } from 'node:child_process';
import { parseFrontmatter, serializeFrontmatter } from './lib/frontmatter.mjs';

const EDITOR_DIR = path.dirname(fileURLToPath(import.meta.url));

const STATIC_FILES = {
  '/': { file: 'public/index.html', type: 'text/html; charset=utf-8' },
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

export function createServer(projectRoot) {
  const guideDir = path.join(projectRoot, 'src/content/guide');
  const configPath = path.join(projectRoot, 'site.config.json');

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
        const slug = pageMatch[1];
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
        const slug = pageMatch[1];
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
  const server = createServer(process.cwd());
  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`[editor] ${url} 에서 실행 중입니다.`);
    openBrowser(url);
  });
}
