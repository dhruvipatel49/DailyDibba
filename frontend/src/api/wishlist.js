import { apiFetch } from './client.js';

export async function getWishlist() {
  return apiFetch('/api/wishlist');
}

export async function toggleWishlist(dishId) {
  return apiFetch(`/api/wishlist/${dishId}/toggle`, { method: 'POST' });
}

export async function removeFromWishlist(dishId) {
  return apiFetch(`/api/wishlist/${dishId}`, { method: 'DELETE' });
}

