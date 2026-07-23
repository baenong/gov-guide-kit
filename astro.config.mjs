import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import remarkDirective from 'remark-directive';
import { remarkContainers } from './src/plugins/remark-containers.mjs';
import { remarkVariables } from './src/plugins/remark-variables.mjs';
import { rehypeAttachments } from './src/plugins/rehype-attachments.mjs';
import { rehypeImages } from './src/plugins/rehype-images.mjs';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
const isGithubPages = deployTarget === 'github-pages';

// astro.config.mjs is loaded directly by Node before Vite starts, so a
// plain `import x from './site.variables.json'` would depend on the
// exact Node version's import-attribute support. Reading it with fs
// avoids that entirely.
const siteVariables = JSON.parse(
  readFileSync(fileURLToPath(new URL('./site.variables.json', import.meta.url)), 'utf-8'),
);

export default defineConfig({
  site: isGithubPages
    ? 'https://example.github.io'
    : 'https://example.vercel.app',
  base: isGithubPages ? (process.env.GITHUB_PAGES_BASE ?? '/') : '/',
  markdown: {
    remarkPlugins: [remarkDirective, [remarkVariables, siteVariables], remarkContainers],
    rehypePlugins: [rehypeAttachments, rehypeImages],
  },
});
