import { apiFetch } from './client.js';

export async function getCooks(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const qs = q.toString();
  return apiFetch(`/api/cooks${qs ? `?${qs}` : ''}`);
}

export async function getCook(id) {
  return apiFetch(`/api/cooks/${id}`);
}

export async function getCookReviews(id) {
  return apiFetch(`/api/cooks/${id}/reviews`);
}

