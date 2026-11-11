import { apiFetch } from './client.js';

export async function getMenu(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const qs = q.toString();
  return apiFetch(`/api/menu${qs ? `?${qs}` : ''}`);
}

export async function getCategories() {
  return apiFetch('/api/menu/categories');
}

