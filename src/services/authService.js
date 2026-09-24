import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

export async function authenticateUser(credentials) {
  const email = (credentials.identifier || credentials.email || '').trim();
  const password = credentials.password || '';

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await handleApiResponse(response);

    // Normalize user and role for frontend consumers
    const normalizedRole = result.role === 'Backoffice' ? 'BackofficeOfficer' : result.role;
    const userObj = {
      id: result.userId,
      name: result.fullName || 'User',
      email: email,
      role: normalizedRole,
      rawRole: result.role,
      status: 'Active',
    };

    localStorage.setItem('solargrid_token', result.token);
    localStorage.setItem('solargrid_user', JSON.stringify(userObj));
    localStorage.setItem('solargrid_role', normalizedRole);

    return {
      token: result.token,
      role: normalizedRole,
      rawRole: result.role,
      user: userObj,
      expiryMinutes: result.expiryMinutes,
    };
  } catch (apiErr) {
    throw apiErr;
  }
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

export async function getCurrentUserProfile() {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
}

export async function updateCurrentUserProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fullName: profileData.name || profileData.fullName,
      phoneNumber: profileData.phone || profileData.phoneNumber || '+94771234567',
      address: profileData.address || 'Microgrid Operations Center',
    }),
  });
  return handleApiResponse(response);
}

export async function updateUserPassword(userId, currentPassword, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      }),
    });
    return handleApiResponse(response);
  } catch (err) {
    throw err;
  }
}
