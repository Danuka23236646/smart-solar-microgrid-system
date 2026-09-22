import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialUsers } from './mockData';

let localUsers = [...initialUsers];

export async function getUsers() {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }
  await new Promise((r) => setTimeout(r, 350));
  return [...localUsers];
}

export async function createUser(userData) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleApiResponse(response);
  }
  await new Promise((r) => setTimeout(r, 400));
  const newUser = {
    id: `USR-${String(localUsers.length + 1).padStart(3, '0')}`,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  localUsers.push(newUser);
  return newUser;
}

export async function updateUser(id, updateData) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleApiResponse(response);
  }
  await new Promise((r) => setTimeout(r, 350));
  const idx = localUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('User not found');
  localUsers[idx] = { ...localUsers[idx], ...updateData };
  return localUsers[idx];
}

export async function toggleUserStatus(id) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }
  await new Promise((r) => setTimeout(r, 300));
  const idx = localUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('User not found');
  const newStatus = localUsers[idx].status === 'Active' ? 'Inactive' : 'Active';
  localUsers[idx].status = newStatus;
  return localUsers[idx];
}
