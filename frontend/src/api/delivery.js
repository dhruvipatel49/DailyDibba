import { apiFetch } from './client.js';

export async function getAssignments(status = 'offered') {
  return apiFetch(`/api/delivery/assignments?status=${status}`);
}

export async function acceptAssignment(id) {
  return apiFetch(`/api/delivery/assignments/${id}/accept`, { method: 'POST' });
}

export async function declineAssignment(id) {
  return apiFetch(`/api/delivery/assignments/${id}/decline`, { method: 'POST' });
}

export async function getDeliveries(kind, scope = 'active') {
  const q = new URLSearchParams({ scope });
  if (kind) q.set('kind', kind);
  return apiFetch(`/api/delivery/deliveries?${q.toString()}`);
}

export async function updateDeliveryStatus(id, status) {
  return apiFetch(`/api/delivery/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateAvailability(isAvailable) {
  return apiFetch('/api/delivery/availability', {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable }),
  });
}

