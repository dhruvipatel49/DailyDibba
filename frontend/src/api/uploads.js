import { apiFetch } from './client.js';

/**
 * Upload an image file to POST /api/uploads/image (multipart field "image").
 * @param {File} file
 * @returns {Promise<{url: string}>}
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  return apiFetch('/api/uploads/image', {
    method: 'POST',
    body: formData,
  });
}
