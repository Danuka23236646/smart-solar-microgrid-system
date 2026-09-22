import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialProsumers } from './mockData';

let localProsumers = [...initialProsumers];

export async function getProsumers(filters = {}) {
  if (API_BASE_URL) {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/prosumers?${params}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  let result = [...localProsumers];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) => p.nic.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }

  if (filters.status && filters.status !== 'All') {
    result = result.filter((p) => p.status === filters.status);
  }

  return result;
}

export async function getProsumerByNic(nic) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 250));
  const prosumer = localProsumers.find((p) => p.nic === nic);
  if (!prosumer) throw new Error('Prosumer not found');
  return { ...prosumer };
}

export async function createProsumer(data) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 450));
  const exists = localProsumers.some((p) => p.nic === data.nic.trim());
  if (exists) {
    const err = new Error(`Prosumer with NIC ${data.nic} already exists in the system.`);
    err.code = 'DUPLICATE_NIC';
    throw err;
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

export async function updateProsumer(nic, data) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const idx = localProsumers.findIndex((p) => p.nic === nic);
  if (idx === -1) throw new Error('Prosumer not found');

  localProsumers[idx] = {
    ...localProsumers[idx],
    ...data,
  };
  return localProsumers[idx];
}

export async function approveProsumer(nic) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 400));
  const idx = localProsumers.findIndex((p) => p.nic === nic);
  if (idx === -1) throw new Error('Prosumer not found');
  localProsumers[idx].status = 'Active';
  return localProsumers[idx];
}

export async function rejectProsumer(nic, reason) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 400));
  const idx = localProsumers.findIndex((p) => p.nic === nic);
  if (idx === -1) throw new Error('Prosumer not found');
  localProsumers[idx].status = 'Inactive';
  localProsumers[idx].rejectionReason = reason;
  return localProsumers[idx];
}

export async function deactivateProsumer(nic, reason = '') {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const idx = localProsumers.findIndex((p) => p.nic === nic);
  if (idx === -1) throw new Error('Prosumer not found');
  localProsumers[idx].status = 'Inactive';
  localProsumers[idx].deactivationReason = reason;
  return localProsumers[idx];
}

export async function reactivateProsumer(nic, justification) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/prosumers/${nic}/reactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ justification }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 400));
  const idx = localProsumers.findIndex((p) => p.nic === nic);
  if (idx === -1) throw new Error('Prosumer not found');
  localProsumers[idx].status = 'Active';
  localProsumers[idx].reactivationJustification = justification;
  return localProsumers[idx];
}
