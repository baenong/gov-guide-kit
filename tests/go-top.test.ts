import { describe, it, expect, beforeEach } from 'vitest';
import { shouldShowGoTop, initGoTop } from '../src/scripts/go-top';

describe('shouldShowGoTop', () => {
  it('is false at the top of the page', () => {
    expect(shouldShowGoTop(0)).toBe(false);
  });

  it('is true once scrolled past the default threshold', () => {
    expect(shouldShowGoTop(400)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(shouldShowGoTop(50, 100)).toBe(false);
    expect(shouldShowGoTop(150, 100)).toBe(true);
  });
});

describe('initGoTop', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button class="guide-go-top"></button>';
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  it('shows the button once the page scrolls past the threshold', () => {
    initGoTop(document);
    const button = document.querySelector('.guide-go-top')!;
    expect(button.classList.contains('guide-go-top--visible')).toBe(false);

    (window as unknown as { scrollY: number }).scrollY = 400;
    window.dispatchEvent(new Event('scroll'));
    expect(button.classList.contains('guide-go-top--visible')).toBe(true);
  });

  it('scrolls to the top when clicked', () => {
    let scrolledTo: ScrollToOptions | undefined;
    window.scrollTo = ((options?: ScrollToOptions) => {
      scrolledTo = options;
    }) as typeof window.scrollTo;

    initGoTop(document);
    const button = document.querySelector<HTMLButtonElement>('.guide-go-top')!;
    button.click();

    expect(scrolledTo).toEqual({ top: 0, behavior: 'smooth' });
  });
});
