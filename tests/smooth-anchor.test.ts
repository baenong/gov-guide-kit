import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initSmoothAnchors } from '../src/scripts/smooth-anchor';

beforeEach(() => {
  document.body.innerHTML = `
    <nav class="guide-toc">
      <a href="#section-two">섹션 2</a>
      <a href="#missing">없는 섹션</a>
      <a href="https://example.com">외부 링크</a>
    </nav>
    <h2 id="section-two">섹션 2</h2>
  `;
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
});

describe('initSmoothAnchors', () => {
  it('smooth-scrolls to the matching heading and prevents default navigation', () => {
    initSmoothAnchors(document);
    const link = document.querySelector<HTMLAnchorElement>('a[href="#section-two"]')!;
    const heading = document.getElementById('section-two')!;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('does nothing when the hash has no matching element on the page', () => {
    initSmoothAnchors(document);
    const link = document.querySelector<HTMLAnchorElement>('a[href="#missing"]')!;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it('ignores links that are not in-page anchors', () => {
    initSmoothAnchors(document);
    const link = document.querySelector<HTMLAnchorElement>('a[href="https://example.com"]')!;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it('scrolls instantly when the user prefers reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    initSmoothAnchors(document);
    const link = document.querySelector<HTMLAnchorElement>('a[href="#section-two"]')!;
    const heading = document.getElementById('section-two')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });
});
