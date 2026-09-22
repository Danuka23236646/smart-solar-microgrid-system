import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialNodes, initialReservations } from './mockData';

let localNodes = [...initialNodes];

export async function getNodes(filters = {}) {
  if (API_BASE_URL) {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/nodes?${params}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  let result = [...localNodes];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (n) => n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.address.toLowerCase().includes(q)
    );
  }

  if (filters.status && filters.status !== 'All') {
    result = result.filter((n) => n.status === filters.status);
  }

  return result;
}

export async function getNodeById(id) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${id}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 250));
  const node = localNodes.find((n) => n.id === id);
  if (!node) throw new Error('Microgrid Node not found');
  return { ...node };
}

export async function createNode(data) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 450));
  const id = data.id?.trim() || `ND-NEW-${String(localNodes.length + 1).padStart(2, '0')}`;
  
  if (localNodes.some((n) => n.id === id)) {
    const err = new Error(`Node identifier ${id} is already in use.`);
    err.code = 'DUPLICATE_NODE_ID';
    throw err;
  }

  const newNode = {
    id,
    name: data.name.trim(),
    address: data.address.trim(),
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    capacityKw: parseFloat(data.capacityKw),
    storageCapacityKwh: parseFloat(data.storageCapacityKwh),
    totalSlots: parseInt(data.totalSlots, 10) || 6,
    availableSlots: parseInt(data.totalSlots, 10) || 6,
    status: data.status || 'Active',
    commissionedDate: new Date().toISOString().split('T')[0],
  };

  localNodes.push(newNode);
  return newNode;
}

export async function updateNode(id, data) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const idx = localNodes.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Microgrid Node not found');

  localNodes[idx] = {
    ...localNodes[idx],
    ...data,
    latitude: parseFloat(data.latitude) || localNodes[idx].latitude,
    longitude: parseFloat(data.longitude) || localNodes[idx].longitude,
    capacityKw: parseFloat(data.capacityKw) || localNodes[idx].capacityKw,
    storageCapacityKwh: parseFloat(data.storageCapacityKwh) || localNodes[idx].storageCapacityKwh,
    totalSlots: parseInt(data.totalSlots, 10) || localNodes[idx].totalSlots,
  };

  return localNodes[idx];
}

export async function deactivateNode(id) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 400));
  const node = localNodes.find((n) => n.id === id);
  if (!node) throw new Error('Microgrid Node not found');

  // Business Rule: Check if active or approved forward reservations exist for this node
  const blockingReservations = initialReservations.filter(
    (res) => res.nodeId === id && (res.status === 'Approved' || res.status === 'Pending')
  );

  if (blockingReservations.length > 0) {
    const resIds = blockingReservations.map((r) => r.id).join(', ');
    const err = new Error(
      `Cannot deactivate node ${node.name} (${id}). There are ${blockingReservations.length} active or pending energy reservations scheduled (${resIds}). Reassign or cancel these reservations first.`
    );
    err.code = 'ACTIVE_RESERVATIONS_EXIST';
    err.blockingReservations = blockingReservations;
    throw err;
  }

  node.status = 'Inactive';
  return node;
}
