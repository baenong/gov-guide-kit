import { api } from './api-client.js';
import { insertAtCursor, insertBlockAtCursor, SNIPPETS } from './toolbar.js';

export function computeReorderPayload(slugsInDisplayOrder) {
  return slugsInDisplayOrder.map((slug, index) => ({ slug, order: index }));
}

let currentSlug = null;
let cachedPages = [];

function renderPageList(pages) {
  cachedPages = pages;
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
      insertBlockAtCursor(textarea, snippet.before, snippet.after);
    });
  });
}

function wirePageLinkButton() {
  document.getElementById('page-link-button').addEventListener('click', () => {
    if (cachedPages.length === 0) {
      alert('연결할 페이지가 없습니다.');
      return;
    }
    const options = cachedPages.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
    const choice = prompt(`연결할 페이지 번호를 입력하세요:\n${options}`);
    const index = Number(choice) - 1;
    const target = cachedPages[index];
    if (!target) return;
    const href = target.slug === 'index' ? '/' : `/guide/${target.slug}`;
    const textarea = document.getElementById('page-body');
    insertAtCursor(textarea, `[${target.title}](${href})`, '');
  });
}

function pickAndUpload(kind) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' ? 'image/*' : '*/*';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve({ filename: file.name, dataBase64: base64 });
      };
      reader.readAsDataURL(file);
    });
    input.click();
  });
}

function wireUploadButtons() {
  document.getElementById('image-button').addEventListener('click', async () => {
    const picked = await pickAndUpload('image');
    if (!picked) return;
    const { path } = await api.upload(picked.filename, picked.dataBase64, 'image');
    insertBlockAtCursor(document.getElementById('page-body'), `![설명](${path})`, '');
  });

  document.getElementById('attachment-button').addEventListener('click', async () => {
    const picked = await pickAndUpload('file');
    if (!picked) return;
    const { path } = await api.upload(picked.filename, picked.dataBase64, 'file');
    insertBlockAtCursor(document.getElementById('page-body'), `[${picked.filename}](${path})`, '');
  });
}

function wireStaticControls() {
  document.getElementById('save-button').addEventListener('click', saveCurrentPage);
  document.getElementById('new-page-button').addEventListener('click', createNewPage);
  wireToolbar();
  wirePageLinkButton();
  wireUploadButtons();
}

async function init() {
  wireStaticControls();
  await refreshPageList();
}

if (typeof document !== 'undefined' && document.getElementById('page-list')) {
  init();
}
