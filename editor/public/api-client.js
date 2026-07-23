async function request(path, options) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `요청 실패: ${res.status}`);
  }
  return body;
}

export const api = {
  listPages: () => request('/api/pages'),
  getPage: (slug) => request(`/api/pages/${encodeURIComponent(slug)}`),
  savePage: (slug, data) =>
    request(`/api/pages/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  createPage: (title) =>
    request('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  deletePage: (slug) => request(`/api/pages/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  reorder: (order) =>
    request('/api/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    }),
  getConfig: () => request('/api/config'),
  saveConfig: (config) =>
    request('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),
  upload: (filename, dataBase64, kind) =>
    request('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, dataBase64, kind }),
    }),
  getVariables: () => request('/api/variables'),
  saveVariables: (variables) =>
    request('/api/variables', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables),
    }),
};
