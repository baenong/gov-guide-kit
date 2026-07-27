import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkContainers } from '../src/plugins/remark-containers.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('line breaks in markdown body', () => {
  it('turns a single newline inside a paragraph into <br>', () => {
    const html = render('첫째 줄\n둘째 줄');
    expect(html).toContain('첫째 줄<br>\n둘째 줄');
  });

  it('turns a single newline inside a notice callout into <br>', () => {
    const html = render(':::notice\n첫째 줄\n둘째 줄\n:::');
    expect(html).toContain('첫째 줄<br>\n둘째 줄');
    expect(html).toContain('class="guide-callout guide-callout--notice"');
  });
});
