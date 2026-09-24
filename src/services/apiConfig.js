export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('solargrid_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function handleApiResponse(response) {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP error status: ${response.status}` };
    }

    let message = errorData.message || errorData.detail || errorData.title;
    if (errorData.errors && typeof errorData.errors === 'object') {
      const fieldErrors = Object.values(errorData.errors).flat().join(' ');
      if (fieldErrors) message = fieldErrors;
    }

    const error = new Error(message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

export function isOfflineOrDbError(err) {
  if (!err) return true;
  if (err.status === undefined) return true;
  if (err.status === 500 || err.status === 502 || err.status === 503 || err.status === 504) return true;
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('connection') ||
      msg.includes('mongodb') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout') ||
      msg.includes('refused')
    ) {
      return true;
    }
  }
  return false;
}
