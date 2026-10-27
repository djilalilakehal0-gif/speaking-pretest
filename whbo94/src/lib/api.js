async function request(path, options = {}) {
  const res = await fetch(path, { credentials: 'same-origin', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ غير متوقع.');
  return data;
}
const json = (method, body) => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
});

export const api = {
  videos: () => request('/api/videos'),
  video: (id) => request(`/api/videos/${id}`),
  view: (id) => request(`/api/videos/${id}/view`, json('POST')).catch(() => {}),
  like: (id, liked) => request(`/api/videos/${id}/like`, json('POST', { liked })),
  contact: (body) => request('/api/contact', json('POST', body)),
  admin: {
    me: () => request('/api/admin/me'),
    login: (username, password) => request('/api/admin/login', json('POST', { username, password })),
    logout: () => request('/api/admin/logout', json('POST')),
    password: (current, next) => request('/api/admin/password', json('POST', { current, next })),
    save: (id, formData) => request(id ? `/api/admin/videos/${id}` : '/api/admin/videos', { method: id ? 'PUT' : 'POST', body: formData }),
    remove: (id) => request(`/api/admin/videos/${id}`, { method: 'DELETE' }),
    feature: (id, featured) => request(`/api/admin/videos/${id}/feature`, json('POST', { featured })),
    reorder: (ids) => request('/api/admin/videos/reorder', json('POST', { ids })),
    messages: () => request('/api/admin/messages'),
    removeMessage: (id) => request(`/api/admin/messages/${id}`, { method: 'DELETE' }),
  },
};
