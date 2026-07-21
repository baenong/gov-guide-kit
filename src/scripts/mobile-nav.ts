export function initMobileNav(root: Document | HTMLElement = document): void {
  const toggle = root.querySelector<HTMLButtonElement>('.guide-sidebar__toggle');
  const sidebar = root.querySelector<HTMLElement>('.guide-sidebar');
  const backdrop = root.querySelector<HTMLElement>('.guide-sidebar__backdrop');
  if (!toggle || !sidebar || !backdrop) return;

  function open(): void {
    sidebar!.dataset.open = 'true';
    backdrop!.dataset.open = 'true';
    toggle!.setAttribute('aria-expanded', 'true');
  }

  function close(): void {
    sidebar!.dataset.open = 'false';
    backdrop!.dataset.open = 'false';
    toggle!.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = sidebar!.dataset.open === 'true';
    if (isOpen) close();
    else open();
  });

  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar!.dataset.open === 'true') {
      close();
      toggle!.focus();
    }
  });

  sidebar.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = sidebar!.querySelectorAll<HTMLElement>('a, button');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
