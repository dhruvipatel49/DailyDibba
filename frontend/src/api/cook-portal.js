import { apiFetch } from './client.js';

// Cook profile
export async function getCookProfile() {
  return apiFetch('/api/cook/profile');
}

export async function updateCookProfile(body) {
  return apiFetch('/api/cook/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// Cook stats (landing page)
export async function getCookStats() {
  return apiFetch('/api/cook/stats');
}

// Cook menu (Today's Menu)
export async function getCookMenu() {
  return apiFetch('/api/cook/menu');
}

export async function postMenuItem(body) {
  return apiFetch('/api/cook/menu', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function patchMenuItem(id, body) {
  return apiFetch(`/api/cook/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteMenuItem(id) {
  return apiFetch(`/api/cook/menu/${id}`, { method: 'DELETE' });
}

// Cook orders
export async function getCookOrders(scope = 'active') {
  return apiFetch(`/api/cook/orders?scope=${scope}`);
}

export async function updateCookOrderStatus(id, status) {
  return apiFetch(`/api/cook/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

