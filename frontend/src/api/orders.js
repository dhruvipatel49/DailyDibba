import { apiFetch } from './client.js';

export async function getOrders(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const qs = q.toString();
  return apiFetch(`/api/orders${qs ? `?${qs}` : ''}`);
}

export async function getOrder(id) {
  return apiFetch(`/api/orders/${id}`);
}

export async function checkout(body) {
  return apiFetch('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function pickup(body) {
  return apiFetch('/api/orders/pickup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cancelOrder(id) {
  return apiFetch(`/api/orders/${id}/cancel`, { method: 'POST' });
}

export async function reviewOrder(id, body) {
  return apiFetch(`/api/orders/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function payOrder(id) {
  return apiFetch(`/api/orders/${id}/pay`, { method: 'POST' });
}

