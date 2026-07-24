import { visit } from 'unist-util-visit';

/**
 * Astro's `base` config only rewrites Astro's own asset references — it
 * never touches root-absolute paths written directly in markdown content
 * (page links, images, attachment links), which is exactly the authoring
 * convention this project's README teaches ("경로는 반드시 / 로 시작").
 * Without this, every content-authored link/image breaks the moment the
 * site is deployed under a subpath (GitHub Pages, GitLab Pages both
 * default to /<repo-name>/).
 */
export function rehypeBasePath({ base = '/' } = {}) {
  const normalizedBase = base.replace(/\/$/, '');

  return (tree) => {
    if (!normalizedBase) return;

    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        node.properties.href = rewrite(node.properties.href, normalizedBase);
      }
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        node.properties.src = rewrite(node.properties.src, normalizedBase);
      }
    });
  };
}

function rewrite(path, base) {
  // Only rewrite root-relative paths (a single leading slash). Leave
  // external URLs, protocol-relative (//host/...), and scheme links
  // (mailto:, tel:) untouched.
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}
