import { apiFetch } from './client.js';

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

export async function updateMe(data) {
  return apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

