/**
 * src/api/client.js
 * Central fetch wrapper for DailyDibba API.
 * - Adds base URL from VITE_API_URL
 * - Injects Authorization: Bearer <token> from localStorage
 * - Parses JSON and throws Error carrying server's `error` (and `details`) on non-2xx
 * - On 401: clears stored token + user and dispatches 'auth:logout'
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export function imageUrl(relativePath) {
  if (!relativePath) return '';
  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('data:') ||
    relativePath.startsWith('blob:')
  ) {
    return relativePath;
  }
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${path}`;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('dd_token');

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // On 401 while carrying a token, clear auth state and log the user out
  if (res.status === 401 && token) {
    localStorage.removeItem('dd_token');
    localStorage.removeItem('dd_user');
    window.dispatchEvent(new Event('auth:logout'));
  }

  if (res.status === 204) {
    return null;
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = text ? { error: text } : null;
  }

  if (!res.ok) {
    const baseMsg = data?.error || `Request failed (${res.status})`;
    const detailText = Array.isArray(data?.details) && data.details.length > 0
      ? data.details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('; ')
      : '';
    const message = detailText ? `${baseMsg}: ${detailText}` : baseMsg;
    const err = new Error(message);
    err.details = data?.details;
    err.status = res.status;
    throw err;
  }

  return data;
}

export default apiFetch;
