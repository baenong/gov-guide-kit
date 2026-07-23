export function shouldShowGoTop(scrollY: number, threshold = 150): boolean {
  return scrollY > threshold;
}

export function initGoTop(root: Document | HTMLElement = document): void {
  const button = root.querySelector<HTMLButtonElement>('.guide-go-top');
  if (!button) return;

  function updateVisibility(): void {
    button!.classList.toggle('guide-go-top--visible', shouldShowGoTop(window.scrollY));
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
