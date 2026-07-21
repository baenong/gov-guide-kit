import { describe, it, expect, beforeEach } from 'vitest';
import { initMobileNav } from '../src/scripts/mobile-nav';

function setupDom() {
  document.body.innerHTML = `
    <button class="guide-sidebar__toggle" aria-expanded="false" aria-controls="guide-sidebar">메뉴</button>
    <div class="guide-sidebar__backdrop" data-open="false"></div>
    <nav id="guide-sidebar" class="guide-sidebar" data-open="false">
      <a href="/">메인</a>
      <a href="/guide/sample">예시</a>
    </nav>
  `;
}

describe('initMobileNav', () => {
  beforeEach(() => {
    setupDom();
    initMobileNav(document);
  });

  it('opens the drawer when the toggle button is clicked', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the drawer on Escape key', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('false');
  });

  it('closes the drawer when the backdrop is clicked', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const backdrop = document.querySelector<HTMLElement>('.guide-sidebar__backdrop')!;
    backdrop.click();
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('false');
  });

  it('traps focus within the sidebar links while open', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const links = document.querySelectorAll<HTMLAnchorElement>('#guide-sidebar a');
    links[links.length - 1].focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.getElementById('guide-sidebar')!.dispatchEvent(event);
    expect(document.activeElement).toBe(links[0]);
  });
});
