import { apiFetch } from './client.js';

export async function getNotifications() {
  return apiFetch('/api/notifications');
}

export async function markAllRead() {
  return apiFetch('/api/notifications/read-all', { method: 'POST' });
}

export async function markOneRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

