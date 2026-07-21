import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeAttachments } from '../src/plugins/rehype-attachments.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeAttachments)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('rehypeAttachments', () => {
  it('converts a document link into an attachment card', () => {
    const html = render('[2026년 임용등록원서.hwp](assets/files/2026-form.hwp)');
    expect(html).toContain('guide-attachment-card');
    expect(html).toContain('download');
    expect(html).toContain('HWP');
    expect(html).toContain('2026년 임용등록원서.hwp');
  });

  it('leaves an internal page link untouched', () => {
    const html = render('[다른 페이지](/guide/registration)');
    expect(html).not.toContain('guide-attachment-card');
  });

  it('leaves an image markdown untouched', () => {
    const html = render('![증명사진 예시](assets/images/photo-example.png)');
    expect(html).not.toContain('guide-attachment-card');
  });
});
