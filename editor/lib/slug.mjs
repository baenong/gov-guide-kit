export function slugify(title) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'page';
}

export function uniqueSlug(title, existingSlugs) {
  const base = slugify(title);
  if (!existingSlugs.includes(base)) return base;
  let n = 2;
  while (existingSlugs.includes(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}
