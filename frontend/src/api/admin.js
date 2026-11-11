import { apiFetch } from './client.js';

export async function getAdminStats() {
  return apiFetch('/api/admin/stats');
}

export async function getAdminUsers(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  return apiFetch(`/api/admin/users?${q.toString()}`);
}

export async function patchAdminUser(id, body) {
  return apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getAdminCooks(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return apiFetch(`/api/admin/cooks?${q.toString()}`);
}

export async function patchAdminCook(id, body) {
  return apiFetch(`/api/admin/cooks/${id}/approval`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getAdminOrders(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  return apiFetch(`/api/admin/orders?${q.toString()}`);
}

export async function patchAdminOrderStatus(id, status) {
  return apiFetch(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getDeliveryPartners() {
  return apiFetch('/api/admin/delivery-partners');
}

export async function assignOrder(orderId, partnerId) {
  return apiFetch(`/api/admin/orders/${orderId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ partnerId }),
  });
}

