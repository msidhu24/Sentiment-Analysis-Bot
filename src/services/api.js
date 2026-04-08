/**
 * Strict Networking configuration.
 * All data synthesis, API management, and proxy connections are handled firmly
 * on the backend to enforce strict non-mocking architecture and protect CORS limits.
 */

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 12000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function fetchLiveBackendData(ticker, daysHorizon) {
  try {
    const url = `http://localhost:8000/api/analyze?ticker=${ticker}&days=${daysHorizon}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Key Authentication Error');
      }
      throw new Error(`Backend fetch failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
}
