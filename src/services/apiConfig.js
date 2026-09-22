export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
    const error = new Error(errorData.message || errorData.title || 'Request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}
