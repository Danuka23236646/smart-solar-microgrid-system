import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

let localNodes = [];

function normalizeStation(s) {
  if (!s) return null;
  const totalSlots = s.totalBatteryStorageSlots || s.totalSlots || 6;
  
  let unavailableCount = 0;
  try {
    const allOverrides = JSON.parse(localStorage.getItem('solargrid_slot_overrides') || '{}');
    const stationOverrides = allOverrides[s.id] || (s.stationCode ? allOverrides[s.stationCode] : null) || {};
    for (const key in stationOverrides) {
      const status = stationOverrides[key]?.status;
      if (status === 'Unavailable' || status === 'Maintenance') {
        unavailableCount++;
      }
    }
  } catch {}

  const availableSlots = Math.max(0, totalSlots - unavailableCount);
  const capacity = s.capacityKwh || 600;
  const received = s.receivedEnergyKwh || 0;
  const dispatched = s.dispatchedEnergyKwh || 0;
  const netStored = Math.max(0, received - dispatched);
  const currentStored = typeof s.currentStoredEnergyKwh === 'number'
    ? s.currentStoredEnergyKwh
    : Math.min(capacity, netStored);
  const availableIntake = typeof s.availableIntakeKwh === 'number'
    ? s.availableIntakeKwh
    : Math.max(0, Math.round((capacity - currentStored) * 100) / 100);
  const batteryPct = typeof s.batteryStoragePercentage === 'number'
    ? s.batteryStoragePercentage
    : (capacity > 0 ? Math.min(100, Math.round((currentStored / capacity) * 100)) : 0);
  const isOutOfStorage = typeof s.isOutOfStorage === 'boolean'
    ? s.isOutOfStorage
    : (availableSlots <= 0 || availableIntake <= 0);

  return {
    id: s.id,
    stationCode: s.stationCode || s.id,
    name: s.name || '',
    address: s.address || '',
    latitude: typeof s.latitude === 'number' ? s.latitude : parseFloat(s.latitude) || 6.9271,
    longitude: typeof s.longitude === 'number' ? s.longitude : parseFloat(s.longitude) || 79.8612,
    capacityKw: capacity,
    storageCapacityKwh: capacity,
    totalSlots,
    availableSlots,
    receivedEnergyKwh: received,
    dispatchedEnergyKwh: dispatched,
    currentStoredEnergyKwh: currentStored,
    availableIntakeKwh: availableIntake,
    batteryStoragePercentage: batteryPct,
    netEnergyStoredKwh: typeof s.netEnergyStoredKwh === 'number' ? s.netEnergyStoredKwh : Math.round(netStored * 100) / 100,
    isOutOfStorage: isOutOfStorage,
    canReceiveEnergy: typeof s.canReceiveEnergy === 'boolean' ? s.canReceiveEnergy : (!isOutOfStorage && availableSlots > 0 && s.status === 'Active'),
    status: s.status === 'Active' ? 'Active' : 'Inactive',
    rawStatus: s.status,
    operatingSchedule: s.operatingSchedule || [],
    commissionedDate: s.createdAtUtc ? s.createdAtUtc.split('T')[0] : (s.commissionedDate || '2026-01-01'),
  };
}

const codeToIdMap = new Map();

export async function getNodes(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'All') {
      const backendStatus = filters.status === 'Inactive' ? 'Deactivated' : filters.status;
      params.append('status', backendStatus);
    }
    params.append('pageSize', '50');

    const response = await fetch(`${API_BASE_URL}/stations?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    const items = Array.isArray(result) ? result : (result.items || []);
    const normalized = items.map(normalizeStation);
    normalized.forEach((n) => {
      if (n.stationCode && n.id) {
        codeToIdMap.set(n.stationCode, n.id);
        codeToIdMap.set(n.id, n.id);
      }
    });
    return normalized;
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
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
    throw err;
  }
}

async function resolveStationId(idOrCode) {
  if (!idOrCode) throw new Error('Station ID or Code required');
  if (/^[a-fA-F0-9]{24}$/.test(idOrCode)) {
    return idOrCode;
  }
  if (codeToIdMap.has(idOrCode)) {
    return codeToIdMap.get(idOrCode);
  }
  const stations = await getNodes();
  const matched = stations.find((s) => s.stationCode === idOrCode || s.id === idOrCode);
  if (matched && matched.id) {
    codeToIdMap.set(idOrCode, matched.id);
    return matched.id;
  }
  return idOrCode;
}

export async function getNodeById(id) {
  try {
    const stationId = await resolveStationId(id);
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeStation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const node = localNodes.find((n) => n.id === id);
      if (!node) throw new Error('Microgrid Node not found');
      return { ...node };
    }
    throw err;
  }
}

export async function createNode(data) {
  const defaultSchedule = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    openingTime: '08:00',
    closingTime: '18:00',
    isClosed: false,
  }));

  try {
    const response = await fetch(`${API_BASE_URL}/stations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        stationCode: (data.id || data.stationCode || `ST-${Date.now().toString().slice(-4)}`).trim(),
        name: (data.name || '').trim(),
        address: (data.address || '').trim(),
        latitude: parseFloat(data.latitude) || 6.9271,
        longitude: parseFloat(data.longitude) || 79.8612,
        capacityKwh: parseFloat(data.storageCapacityKwh || data.capacityKw || 100),
        totalBatteryStorageSlots: parseInt(data.totalSlots, 10) || 6,
        operatingSchedule: data.operatingSchedule || defaultSchedule,
      }),
    });
    const result = await handleApiResponse(response);
    const normalized = normalizeStation(result);
    if (normalized.stationCode && normalized.id) {
      codeToIdMap.set(normalized.stationCode, normalized.id);
    }
    return normalized;
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const id = data.id?.trim() || `ND-NEW-${String(localNodes.length + 1).padStart(2, '0')}`;
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
    throw err;
  }
}

export async function updateNode(id, data) {
  try {
    const stationId = await resolveStationId(id);
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: (data.name || '').trim(),
        address: (data.address || '').trim(),
        latitude: parseFloat(data.latitude) || 6.9271,
        longitude: parseFloat(data.longitude) || 79.8612,
        capacityKwh: parseFloat(data.storageCapacityKwh || data.capacityKw || 100),
        totalBatteryStorageSlots: parseInt(data.totalSlots, 10) || 6,
      }),
    });
    let result = await handleApiResponse(response);

    // If target operational status was specified, handle activation / deactivation via dedicated endpoints
    if (data.status) {
      const currentStation = normalizeStation(result);
      const targetActive = data.status === 'Active';
      const isCurrentlyActive = currentStation?.status === 'Active';

      if (targetActive && !isCurrentlyActive) {
        const reactivateRes = await fetch(`${API_BASE_URL}/stations/${stationId}/reactivate`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
        });
        result = await handleApiResponse(reactivateRes);
      } else if (!targetActive && isCurrentlyActive) {
        const deactivateRes = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        result = await handleApiResponse(deactivateRes);
      }
    }

    window.dispatchEvent(new Event('solargrid_slots_updated'));
    return normalizeStation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const idx = localNodes.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error('Microgrid Node not found');
      localNodes[idx] = { ...localNodes[idx], ...data };
      window.dispatchEvent(new Event('solargrid_slots_updated'));
      return localNodes[idx];
    }
    throw err;
  }
}

export async function reactivateNode(id) {
  try {
    const stationId = await resolveStationId(id);
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}/reactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    window.dispatchEvent(new Event('solargrid_slots_updated'));
    return normalizeStation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const node = localNodes.find((n) => n.id === id);
      if (!node) throw new Error('Microgrid Node not found');
      node.status = 'Active';
      window.dispatchEvent(new Event('solargrid_slots_updated'));
      return node;
    }
    throw err;
  }
}

export async function deactivateNode(id) {
  try {
    const stationId = await resolveStationId(id);
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    window.dispatchEvent(new Event('solargrid_slots_updated'));
    return normalizeStation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const node = localNodes.find((n) => n.id === id);
      if (!node) throw new Error('Microgrid Node not found');
      node.status = 'Inactive';
      window.dispatchEvent(new Event('solargrid_slots_updated'));
      return node;
    }
    throw err;
  }
}

