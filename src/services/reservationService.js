import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

let localReservations = [];

function normalizeReservation(r) {
  if (!r) return null;
  const isInject = r.transferType === 'EnergyDropOff' || r.transferType === 'Inject';
  return {
    id: r.id,
    reference: r.reservationReference || r.id,
    prosumerId: r.prosumerId,
    prosumerNic: r.prosumerNic || '',
    prosumerName: r.prosumerFullName || r.prosumerName || 'Prosumer',
    nodeId: r.stationId || r.nodeId,
    nodeName: r.stationName || r.nodeName || 'Microgrid Substation',
    stationCode: r.stationCode || '',
    slotNumber: 1,
    bookingSlotId: r.bookingSlotId,
    transferType: isInject ? 'Inject' : 'Draw',
    rawTransferType: r.transferType,
    scheduledStartTime: r.slotStartTimeUtc || r.scheduledStartTime,
    scheduledEndTime: r.slotEndTimeUtc || r.scheduledEndTime,
    energyAmountKwh: r.energyAmountKwh || 0,
    status: r.status || 'Pending',
    notes: r.notes || '',
    rejectionReason: r.rejectionReason || '',
    cancellationReason: r.cancellationReason || '',
    createdAt: r.createdAtUtc || r.createdAt,
    updatedAt: r.updatedAtUtc || r.updatedAt,
    approvedAt: r.approvedAtUtc,
    completedAt: r.completedAtUtc,
  };
}

export async function getReservations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.nodeId && filters.nodeId !== 'All') params.append('stationId', filters.nodeId);
    params.append('pageSize', '50');

    let endpoint = `${API_BASE_URL}/reservations?${params.toString()}`;
    if (filters.status === 'Pending') {
      endpoint = `${API_BASE_URL}/reservations/pending`;
    }

    const response = await fetch(endpoint, { headers: getAuthHeaders() });
    const result = await handleApiResponse(response);
    const items = Array.isArray(result) ? result : (result.items || []);
    return items.map(normalizeReservation);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
      let result = [...localReservations];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (res) =>
            res.id.toLowerCase().includes(q) ||
            res.prosumerNic.toLowerCase().includes(q) ||
            res.prosumerName.toLowerCase().includes(q) ||
            res.nodeName.toLowerCase().includes(q)
        );
      }
      if (filters.status && filters.status !== 'All') {
        result = result.filter((res) => res.status === filters.status);
      }
      if (filters.nodeId && filters.nodeId !== 'All') {
        result = result.filter((res) => res.nodeId === filters.nodeId);
      }
      return result;
    }
    throw err;
  }
}

export async function getReservationById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeReservation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const res = localReservations.find((r) => r.id === id);
      if (!res) throw new Error('Reservation not found');
      return { ...res };
    }
    throw err;
  }
}

export async function getDashboardCounts() {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      return {
        pendingReservationsCount: localReservations.filter((r) => r.status === 'Pending').length,
        approvedFutureReservationsCount: localReservations.filter((r) => r.status === 'Approved').length,
        todaysReservationsCount: localReservations.length,
        cancelledReservationsCount: localReservations.filter((r) => r.status === 'Cancelled').length,
        completedReservationsCount: localReservations.filter((r) => r.status === 'Completed').length,
      };
    }
    throw err;
  }
}

export async function createReservation(data) {
  try {
    const transferType = data.transferType === 'Draw' ? 1 : 0; // 0 = EnergyDropOff, 1 = Charging
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        bookingSlotId: data.bookingSlotId || data.slotId,
        transferType,
        energyAmountKwh: parseFloat(data.energyAmountKwh) || 10,
        notes: data.notes || '',
      }),
    });
    const result = await handleApiResponse(response);
    return normalizeReservation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const newReservation = {
        id: `RES-${Date.now()}`,
        prosumerNic: data.prosumerNic || '',
        prosumerName: data.prosumerName || 'Prosumer',
        nodeId: data.nodeId,
        nodeName: data.nodeName || 'Microgrid Substation',
        slotNumber: parseInt(data.slotNumber, 10) || 1,
        transferType: data.transferType || 'Inject',
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        energyAmountKwh: parseFloat(data.energyAmountKwh) || 10.0,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localReservations.unshift(newReservation);
      return newReservation;
    }
    throw err;
  }
}

export async function cancelReservation(id, reason = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancellationReason: reason }),
    });
    const result = await handleApiResponse(response);
    return normalizeReservation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const res = localReservations.find((r) => r.id === id);
      if (!res) throw new Error('Reservation not found');
      res.status = 'Cancelled';
      res.cancellationReason = reason || 'Cancelled by user request';
      res.updatedAt = new Date().toISOString();
      return res;
    }
    throw err;
  }
}

export async function approveReservation(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return normalizeReservation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const res = localReservations.find((r) => r.id === id);
      if (!res) throw new Error('Reservation not found');
      res.status = 'Approved';
      res.updatedAt = new Date().toISOString();
      return res;
    }
    throw err;
  }
}

export async function rejectReservation(id, reason = 'Rejected by Grid Operator') {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejectionReason: reason }),
    });
    const result = await handleApiResponse(response);
    return normalizeReservation(result);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const res = localReservations.find((r) => r.id === id);
      if (!res) throw new Error('Reservation not found');
      res.status = 'Rejected';
      res.rejectionReason = reason;
      res.updatedAt = new Date().toISOString();
      return res;
    }
    throw err;
  }
}
