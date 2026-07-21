import { api } from './api-client.js';
import { insertAtCursor, SNIPPETS } from './toolbar.js';

export function computeReorderPayload(slugsInDisplayOrder) {
  return slugsInDisplayOrder.map((slug, index) => ({ slug, order: index }));
}

let currentSlug = null;

function renderPageList(pages) {
  const list = document.getElementById('page-list');
  list.innerHTML = '';
  for (const page of pages) {
    const item = document.createElement('li');
    item.draggable = true;
    item.dataset.slug = page.slug;
    item.textContent = page.title;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = '삭제';
    deleteButton.disabled = page.slug === 'index';
    deleteButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!confirm(`"${page.title}" 페이지를 삭제할까요?`)) return;
      await api.deletePage(page.slug);
      await refreshPageList();
    });

    item.appendChild(deleteButton);
    item.addEventListener('click', () => loadPage(page.slug));
    list.appendChild(item);
  }
  wireDragReorder(list);
}

function wireDragReorder(list) {
  let draggedSlug = null;
  list.addEventListener('dragstart', (event) => {
    draggedSlug = event.target.dataset.slug;
  });
  list.addEventListener('dragover', (event) => {
    event.preventDefault();
    const target = event.target.closest('li');
    if (!target || target.dataset.slug === draggedSlug) return;
    const dragged = list.querySelector(`[data-slug="${draggedSlug}"]`);
    const rect = target.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    list.insertBefore(dragged, before ? target : target.nextSibling);
  });
  list.addEventListener('dragend', async () => {
    const slugs = [...list.querySelectorAll('li')].map((el) => el.dataset.slug);
    await api.reorder(computeReorderPayload(slugs));
    await refreshPageList();
  });
}

async function refreshPageList() {
  const pages = await api.listPages();
  renderPageList(pages);
}

async function loadPage(slug) {
  const page = await api.getPage(slug);
  currentSlug = slug;
  document.getElementById('page-title').value = page.title;
  document.getElementById('page-description').value = page.description ?? '';
  document.getElementById('page-body').value = page.body;
}

async function saveCurrentPage() {
  if (!currentSlug) return;
  await api.savePage(currentSlug, {
    title: document.getElementById('page-title').value,
    description: document.getElementById('page-description').value || undefined,
    body: document.getElementById('page-body').value,
  });
  await refreshPageList();
}

async function createNewPage() {
  const title = prompt('새 페이지 제목을 입력하세요');
  if (!title) return;
  const page = await api.createPage(title);
  await refreshPageList();
  await loadPage(page.slug);
}

function wireToolbar() {
  const textarea = document.getElementById('page-body');
  document.querySelectorAll('#toolbar [data-snippet]').forEach((button) => {
    button.addEventListener('click', () => {
      const snippet = SNIPPETS[button.dataset.snippet];
      insertAtCursor(textarea, snippet.before, snippet.after);
    });
  });
}

function wireStaticControls() {
  document.getElementById('save-button').addEventListener('click', saveCurrentPage);
  document.getElementById('new-page-button').addEventListener('click', createNewPage);
  wireToolbar();
}

async function init() {
  wireStaticControls();
  await refreshPageList();
}

if (typeof document !== 'undefined' && document.getElementById('page-list')) {
  init();
}
