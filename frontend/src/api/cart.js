import { apiFetch } from './client.js';

export async function getCart() {
  return apiFetch('/api/cart');
}

/**
 * Set a cart item. quantity=0 removes it.
 */
export async function setCartItem(menuItemId, size, quantity, instructions) {
  return apiFetch('/api/cart/items', {
    method: 'PUT',
    body: JSON.stringify({ menuItemId, size, quantity, instructions }),
  });
}

export async function clearCart() {
  return apiFetch('/api/cart', { method: 'DELETE' });
}

