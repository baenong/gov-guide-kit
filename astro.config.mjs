import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import remarkDirective from 'remark-directive';
import remarkBreaks from 'remark-breaks';
import { remarkContainers } from './src/plugins/remark-containers.mjs';
import { remarkVariables } from './src/plugins/remark-variables.mjs';
import { rehypeAttachments } from './src/plugins/rehype-attachments.mjs';
import { rehypeImages } from './src/plugins/rehype-images.mjs';
import { rehypeBasePath } from './src/plugins/rehype-base-path.mjs';
import { viteWatchVariables } from './src/plugins/vite-watch-variables.mjs';
import { resolveBase } from './scripts/deploy-base.mjs';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';

const SITE_BY_TARGET = {
  vercel: 'https://example.vercel.app',
  'github-pages': 'https://example.github.io',
  'gitlab-pages': 'https://example.gitlab.io',
};

const siteVariablesPath = fileURLToPath(new URL('./site.variables.json', import.meta.url));

const resolvedBase = resolveBase();

export default defineConfig({
  site: SITE_BY_TARGET[deployTarget] ?? SITE_BY_TARGET.vercel,
  base: resolvedBase,
  markdown: {
    remarkPlugins: [remarkDirective, [remarkVariables, siteVariablesPath], remarkContainers, remarkBreaks],
    rehypePlugins: [rehypeAttachments, rehypeImages, [rehypeBasePath, { base: resolvedBase }]],
  },
  vite: {
    plugins: [viteWatchVariables(siteVariablesPath)],
  },
});
