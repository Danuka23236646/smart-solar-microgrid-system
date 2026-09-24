import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

let localProsumers = [];

function normalizeProsumer(u) {
  if (!u) return null;
  return {
    id: u.id,
    nic: u.nic || '',
    name: u.fullName || u.name || 'Prosumer',
    contact: u.phoneNumber || u.contact || '',
    email: u.email || '',
    address: u.address || '',
    solarCapacityKw: u.solarCapacityKw || 5.0,
    status: u.accountStatus || u.status || 'Pending',
    accountStatus: u.accountStatus || u.status,
    registeredDate: u.createdAtUtc ? u.createdAtUtc.split('T')[0] : (u.registeredDate || new Date().toISOString().split('T')[0]),
  };
}

// In-memory cache of resolved NIC -> ID mappings for smooth lookup
const nicToIdMap = new Map();

export async function getProsumers(filters = {}) {
  try {
    let items = [];
    if (filters.status === 'Pending') {
      const response = await fetch(`${API_BASE_URL}/users/prosumers/pending`, {
        headers: getAuthHeaders(),
      });
      const result = await handleApiResponse(response);
      items = Array.isArray(result) ? result : (result.items || []);
    } else {
      const params = new URLSearchParams();
      params.append('role', 'Prosumer');
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      params.append('pageSize', '100');

      const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result = await handleApiResponse(response);
      items = Array.isArray(result) ? result : (result.items || []);
    }

    const normalized = items.map(normalizeProsumer);
    normalized.forEach((p) => {
      if (p.nic && p.id) nicToIdMap.set(p.nic, p.id);
    });
    return normalized;
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
      let result = [...localProsumers];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter((p) => p.nic.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
      }
      if (filters.status && filters.status !== 'All') {
        result = result.filter((p) => p.status === filters.status);
      }
      return result;
    }
    throw err;
  }
}

async function resolveUserId(idOrNic) {
  if (!idOrNic) throw new Error('User identifier required');
  // Check if it's already a 24-character hex MongoDB ObjectId
  if (/^[a-fA-F0-9]{24}$/.test(idOrNic)) {
    return idOrNic;
  }
  if (nicToIdMap.has(idOrNic)) {
    return nicToIdMap.get(idOrNic);
  }
  // Try fetching prosumers to populate mapping
  const prosumers = await getProsumers();
  const matched = prosumers.find((p) => p.nic === idOrNic || p.id === idOrNic);
  if (matched && matched.id) {
    nicToIdMap.set(idOrNic, matched.id);
    return matched.id;
  }
  return idOrNic;
}

export async function getProsumerByNic(nic) {
  try {
    const userId = await resolveUserId(nic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const prosumer = localProsumers.find((p) => p.nic === nic);
      if (!prosumer) throw new Error('Prosumer not found');
      return { ...prosumer };
    }
    throw err;
  }
}

export async function createProsumer(data) {
  const pwd = data.password || 'ProsumerPass123!';
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/prosumer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nic: (data.nic || '').trim(),
        fullName: (data.name || data.fullName || '').trim(),
        email: (data.email || '').trim(),
        phoneNumber: (data.contact || data.phoneNumber || '+94712345678').trim(),
        address: (data.address || 'Sri Lanka').trim(),
        password: pwd,
        confirmPassword: pwd,
      }),
    });
    const result = await handleApiResponse(response);
    const normalized = normalizeProsumer(result);
    if (normalized.nic && normalized.id) nicToIdMap.set(normalized.nic, normalized.id);
    return normalized;
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const exists = localProsumers.some((p) => p.nic === data.nic.trim());
      if (exists) {
        const dupErr = new Error(`Prosumer with NIC ${data.nic} already exists in the system.`);
        dupErr.code = 'DUPLICATE_NIC';
        throw dupErr;
      }
      const newProsumer = {
        nic: data.nic.trim(),
        name: data.name.trim(),
        contact: data.contact.trim(),
        email: data.email.trim(),
        address: data.address.trim(),
        solarCapacityKw: parseFloat(data.solarCapacityKw) || 5.0,
        status: 'Active',
        registeredDate: new Date().toISOString().split('T')[0],
      };
      localProsumers.unshift(newProsumer);
      return newProsumer;
    }
    throw err;
  }
}

export async function updateProsumer(nic, data) {
  try {
    const userId = await resolveUserId(nic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fullName: (data.name || data.fullName || '').trim(),
        phoneNumber: (data.contact || data.phoneNumber || '+94712345678').trim(),
        address: (data.address || '').trim(),
      }),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localProsumers.findIndex((p) => p.nic === nic);
      if (idx === -1) throw new Error('Prosumer not found');
      localProsumers[idx] = { ...localProsumers[idx], ...data };
      return localProsumers[idx];
    }
    throw err;
  }
}

export async function approveProsumer(idOrNic) {
  try {
    const userId = await resolveUserId(idOrNic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localProsumers.findIndex((p) => p.nic === idOrNic || p.id === idOrNic);
      if (idx === -1) throw new Error('Prosumer not found');
      localProsumers[idx].status = 'Active';
      return localProsumers[idx];
    }
    throw err;
  }
}

export async function rejectProsumer(idOrNic, reason = 'Application rejected') {
  try {
    const userId = await resolveUserId(idOrNic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localProsumers.findIndex((p) => p.nic === idOrNic || p.id === idOrNic);
      if (idx === -1) throw new Error('Prosumer not found');
      localProsumers[idx].status = 'Rejected';
      localProsumers[idx].rejectionReason = reason;
      return localProsumers[idx];
    }
    throw err;
  }
}

export async function deactivateProsumer(idOrNic, reason = '') {
  try {
    const userId = await resolveUserId(idOrNic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localProsumers.findIndex((p) => p.nic === idOrNic || p.id === idOrNic);
      if (idx === -1) throw new Error('Prosumer not found');
      localProsumers[idx].status = 'Inactive';
      localProsumers[idx].deactivationReason = reason;
      return localProsumers[idx];
    }
    throw err;
  }
}

export async function reactivateProsumer(idOrNic, justification = '') {
  try {
    const userId = await resolveUserId(idOrNic);
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeProsumer(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localProsumers.findIndex((p) => p.nic === idOrNic || p.id === idOrNic);
      if (idx === -1) throw new Error('Prosumer not found');
      localProsumers[idx].status = 'Active';
      return localProsumers[idx];
    }
    throw err;
  }
}
