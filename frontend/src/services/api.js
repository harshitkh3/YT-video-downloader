/**
 * API service for communicating with the FastAPI backend.
 */

const API_BASE = '/api';

/**
 * Fetch video metadata and resolutions without downloading.
 * @param {string} url - YouTube URL
 */
export async function getVideoInfo(url) {
  const response = await fetch(`${API_BASE}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return response.json();
}

/**
 * Request server to download and prepare media.
 * @param {Object} params
 * @param {string} params.url
 * @param {string} params.mode - "Video (MP4)" or "Audio Only (MP3)"
 * @param {string} params.resolution - Selected resolution
 */
export async function requestDownload({ url, mode, resolution }) {
  const response = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, mode, resolution }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Download failed (${response.status})`);
  }

  return response.json();
}

/**
 * Get server cache storage stats.
 */
export async function getCacheStats() {
  const response = await fetch(`${API_BASE}/cache/stats`);
  if (!response.ok) throw new Error('Failed to get cache statistics');
  return response.json();
}

/**
 * Clear server downloads cache.
 */
export async function clearCache() {
  const response = await fetch(`${API_BASE}/cache`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to clear cache');
  return response.json();
}

/**
 * Delete a specific file from server.
 * @param {string} filename
 */
export async function deleteServerFile(filename) {
  const response = await fetch(`${API_BASE}/file/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete file');
  return response.json();
}

/**
 * Get direct download link for a file.
 * @param {string} filename
 */
export function getFileUrl(filename) {
  return `${API_BASE}/file/${encodeURIComponent(filename)}`;
}
