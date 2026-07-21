import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeImages } from '../src/plugins/rehype-images.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeImages)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('rehypeImages', () => {
  it('adds lazy loading and the responsive class to images', () => {
    const html = render('![증명사진 예시](assets/images/photo-example.png)');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('class="guide-image"');
  });
});
