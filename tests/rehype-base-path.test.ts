import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeBasePath } from '../src/plugins/rehype-base-path.mjs';

function render(markdown: string, base: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeBasePath, { base })
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('rehypeBasePath', () => {
  it('prefixes a root-relative link href with the base path', () => {
    const html = render('[임용등록 안내](/guide/registration)', '/gov-guide-kit');
    expect(html).toContain('href="/gov-guide-kit/guide/registration"');
  });

  it('prefixes a root-relative image src with the base path', () => {
    const html = render('![증명사진](/assets/images/photo.png)', '/gov-guide-kit');
    expect(html).toContain('src="/gov-guide-kit/assets/images/photo.png"');
  });

  it('does nothing when base is the site root', () => {
    const html = render('[링크](/guide/registration)', '/');
    expect(html).toContain('href="/guide/registration"');
  });

  it('leaves an external link untouched', () => {
    const html = render('[외부 사이트](https://example.com/page)', '/gov-guide-kit');
    expect(html).toContain('href="https://example.com/page"');
  });

  it('leaves a protocol-relative link untouched', () => {
    const html = render('[링크](//example.com/page)', '/gov-guide-kit');
    expect(html).toContain('href="//example.com/page"');
  });

  it('leaves a mailto link untouched', () => {
    const html = render('[문의](mailto:test@example.com)', '/gov-guide-kit');
    expect(html).toContain('href="mailto:test@example.com"');
  });

  it('does not double-prefix a path that already has the base', () => {
    const html = render('[링크](/gov-guide-kit/guide/registration)', '/gov-guide-kit');
    expect(html).toContain('href="/gov-guide-kit/guide/registration"');
    expect(html).not.toContain('/gov-guide-kit/gov-guide-kit');
  });
});
