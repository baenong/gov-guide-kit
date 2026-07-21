import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
const isGithubPages = deployTarget === 'github-pages';

export default defineConfig({
  site: isGithubPages
    ? 'https://example.github.io'
    : 'https://example.vercel.app',
  base: isGithubPages ? (process.env.GITHUB_PAGES_BASE ?? '/') : '/',
  markdown: {
    remarkPlugins: [remarkDirective],
    rehypePlugins: [],
  },
});
