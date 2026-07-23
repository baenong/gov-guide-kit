function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initSmoothAnchors(root: Document | HTMLElement = document): void {
  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash.length <= 1) return;

    const id = decodeURIComponent(hash.slice(1));
    const heading = document.getElementById(id);
    if (!heading) return;

    event.preventDefault();
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    history.pushState(null, '', hash);
  });
}
