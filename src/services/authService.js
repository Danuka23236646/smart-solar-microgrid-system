import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialUsers } from './mockData';

export async function authenticateUser(credentials) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      }),
    });
    const result = await handleApiResponse(response);
    localStorage.setItem('solargrid_token', result.token);
    localStorage.setItem('solargrid_user', JSON.stringify(result.user));
    localStorage.setItem('solargrid_role', result.role);
    return result;
  }

  // Simulated latency for realistic enterprise UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  const identifier = credentials.identifier.trim().toLowerCase();
  
  if (identifier === 'server@solar.local') {
    const err = new Error('Centralized API Gateway is temporarily unreachable (503).');
    err.code = 'SERVER_ERROR';
    throw err;
  }

  // Find user by email
  const user = initialUsers.find((u) => u.email.toLowerCase() === identifier);

  if (!user || credentials.password !== 'Solar@123') {
    const err = new Error('Invalid email or password. Please verify your credentials.');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (user.status === 'Inactive') {
    const err = new Error('Your user account has been deactivated by the system administrator.');
    err.code = 'INACTIVE_ACCOUNT';
    throw err;
  }

  const result = {
    token: `jwt_token_${user.role}_${Date.now()}`,
    role: user.role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };

  localStorage.setItem('solargrid_token', result.token);
  localStorage.setItem('solargrid_user', JSON.stringify(result.user));
  localStorage.setItem('solargrid_role', result.role);

  return result;
}

export function getCurrentSession() {
  const token = localStorage.getItem('solargrid_token');
  const userStr = localStorage.getItem('solargrid_user');
  const role = localStorage.getItem('solargrid_role');

  if (!token || !userStr || !role) {
    return null;
  }

  try {
    return {
      token,
      role,
      user: JSON.parse(userStr),
    };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('solargrid_token');
  localStorage.removeItem('solargrid_user');
  localStorage.removeItem('solargrid_role');
}

export async function updateUserPassword(userId, currentPassword, newPassword) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleApiResponse(response);
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  if (currentPassword !== 'Solar@123') {
    const err = new Error('Current password does not match our records.');
    err.code = 'PASSWORD_MISMATCH';
    throw err;
  }
  return { success: true, message: 'Password updated successfully.' };
}
