import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

let localUsers = [];

function normalizeUser(u) {
  if (!u) return null;
  const roleName = u.role === 'Backoffice' ? 'BackofficeOfficer' : u.role;
  return {
    id: u.id,
    name: u.fullName || u.name || 'User',
    email: u.email,
    role: roleName,
    rawRole: u.role,
    status: (u.accountStatus === 'Active' || u.status === 'Active') ? 'Active' : 'Inactive',
    accountStatus: u.accountStatus || u.status,
    phone: u.phoneNumber || u.phone || '',
    address: u.address || '',
    nic: u.nic || '',
    createdAt: u.createdAtUtc ? u.createdAtUtc.split('T')[0] : (u.createdAt || ''),
  };
}

export async function getUsers(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.role && filters.role !== 'All') {
      const backendRole = filters.role === 'BackofficeOfficer' ? 'Backoffice' : filters.role;
      params.append('role', backendRole);
    }
    params.append('pageSize', '100');

    const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    const items = Array.isArray(result) ? result : (result.items || []);
    return items.map(normalizeUser);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
      return [...localUsers];
    }
    throw err;
  }
}

export async function createUser(userData) {
  const backendRole = userData.role === 'BackofficeOfficer' || userData.role === 'Backoffice' ? 'Backoffice' : 'GridOperator';
  const password = userData.password || 'StaffPassword123!';

  try {
    const response = await fetch(`${API_BASE_URL}/users/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fullName: (userData.name || userData.fullName || '').trim(),
        email: (userData.email || '').trim(),
        phoneNumber: userData.phone || userData.phoneNumber || '+94771234567',
        address: userData.address || 'Microgrid Operations Office, Colombo',
        password: password,
        confirmPassword: password,
        role: backendRole,
      }),
    });
    const result = await handleApiResponse(response);
    return normalizeUser(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const newUser = {
        id: `USR-${String(localUsers.length + 1).padStart(3, '0')}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      localUsers.push(newUser);
      return newUser;
    }
    throw err;
  }
}

export async function updateUser(id, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fullName: (updateData.name || updateData.fullName || '').trim(),
        phoneNumber: updateData.phone || updateData.phoneNumber || '+94771234567',
        address: updateData.address || 'SunGrid Facilities Network',
      }),
    });
    const result = await handleApiResponse(response);
    return normalizeUser(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localUsers.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('User not found');
      localUsers[idx] = { ...localUsers[idx], ...updateData };
      return localUsers[idx];
    }
    throw err;
  }
}

export async function toggleUserStatus(id, currentStatus) {
  try {
    // If currently active, deactivate; if inactive, reactivate
    const isCurrentlyActive = currentStatus === 'Active';
    const endpoint = isCurrentlyActive ? `${API_BASE_URL}/users/${id}` : `${API_BASE_URL}/users/${id}/reactivate`;
    const method = isCurrentlyActive ? 'DELETE' : 'PATCH';

    const response = await fetch(endpoint, {
      method,
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeUser(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localUsers.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('User not found');
      const newStatus = localUsers[idx].status === 'Active' ? 'Inactive' : 'Active';
      localUsers[idx].status = newStatus;
      return localUsers[idx];
    }
    throw err;
  }
}
