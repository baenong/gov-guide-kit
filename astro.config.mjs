import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import { remarkContainers } from './src/plugins/remark-containers.mjs';
import { rehypeAttachments } from './src/plugins/rehype-attachments.mjs';
import { rehypeImages } from './src/plugins/rehype-images.mjs';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
const isGithubPages = deployTarget === 'github-pages';

export default defineConfig({
  site: isGithubPages
    ? 'https://example.github.io'
    : 'https://example.vercel.app',
  base: isGithubPages ? (process.env.GITHUB_PAGES_BASE ?? '/') : '/',
  markdown: {
    remarkPlugins: [remarkDirective, remarkContainers],
    rehypePlugins: [rehypeAttachments, rehypeImages],
  },
});
