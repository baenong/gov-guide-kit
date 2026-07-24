import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkContainers } from '../src/plugins/remark-containers.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('remarkContainers', () => {
  it('renders a notice container as a styled div', () => {
    const html = render(':::notice\n안내 문구\n:::');
    expect(html).toContain('class="guide-callout guide-callout--notice"');
    expect(html).toContain('안내 문구');
  });

  it('renders a warning container with its own modifier class', () => {
    const html = render(':::warning\n마감 임박\n:::');
    expect(html).toContain('class="guide-callout guide-callout--warning"');
  });

  it('parses a calendar container into event JSON', () => {
    const html = render(
      ':::calendar\n- 2026-08-15: 임용등록 마감\n- 2026-08-20: 서류 제출\n:::',
    );
    expect(html).toContain('class="guide-calendar"');
    expect(html).toContain('data-events=');
    expect(html).toContain('임용등록 마감');
    expect(html).toContain('2026-08-15');
  });

  it('ignores unrecognized directive names', () => {
    const html = render(':::unknown\ntext\n:::');
    expect(html).not.toContain('guide-callout');
    expect(html).not.toContain('guide-calendar');
  });

  it('parses a date-range event line into date/endDate/title', () => {
    const html = render(':::calendar\n- 2026-08-17~2026-08-19: 하계휴가\n:::');
    const match = html.match(/data-events="([^"]*)"/)!;
    const decoded = match[1].replace(/&#x22;/g, '"');
    const events = JSON.parse(decoded);
    expect(events).toEqual([{ date: '2026-08-17', endDate: '2026-08-19', title: '하계휴가' }]);
  });

  it('omits endDate for a single-day event line', () => {
    const html = render(':::calendar\n- 2026-08-15: 임용등록 마감\n:::');
    const match = html.match(/data-events="([^"]*)"/)!;
    const decoded = match[1].replace(/&#x22;/g, '"');
    const events = JSON.parse(decoded);
    expect(events).toEqual([{ date: '2026-08-15', title: '임용등록 마감' }]);
  });
});
