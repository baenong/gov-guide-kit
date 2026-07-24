import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import remarkDirective from 'remark-directive';
import { remarkContainers } from './src/plugins/remark-containers.mjs';
import { remarkVariables } from './src/plugins/remark-variables.mjs';
import { rehypeAttachments } from './src/plugins/rehype-attachments.mjs';
import { rehypeImages } from './src/plugins/rehype-images.mjs';
import { rehypeBasePath } from './src/plugins/rehype-base-path.mjs';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';

const SITE_BY_TARGET = {
  vercel: 'https://example.vercel.app',
  'github-pages': 'https://example.github.io',
  'gitlab-pages': 'https://example.gitlab.io',
};

const BASE_BY_TARGET = {
  vercel: '/',
  'github-pages': process.env.GITHUB_PAGES_BASE ?? '/',
  'gitlab-pages': process.env.GITLAB_PAGES_BASE ?? '/',
};

// astro.config.mjs is loaded directly by Node before Vite starts, so a
// plain `import x from './site.variables.json'` would depend on the
// exact Node version's import-attribute support. Reading it with fs
// avoids that entirely.
const siteVariables = JSON.parse(
  readFileSync(fileURLToPath(new URL('./site.variables.json', import.meta.url)), 'utf-8'),
);

const resolvedBase = BASE_BY_TARGET[deployTarget] ?? BASE_BY_TARGET.vercel;

export default defineConfig({
  site: SITE_BY_TARGET[deployTarget] ?? SITE_BY_TARGET.vercel,
  base: resolvedBase,
  markdown: {
    remarkPlugins: [remarkDirective, [remarkVariables, siteVariables], remarkContainers],
    rehypePlugins: [rehypeAttachments, rehypeImages, [rehypeBasePath, { base: resolvedBase }]],
  },
});
