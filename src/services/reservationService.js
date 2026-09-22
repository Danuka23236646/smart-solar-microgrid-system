import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialReservations } from './mockData';

let localReservations = [...initialReservations];

// Current reference timestamp (matches 2026-09-17)
const NOW_MS = new Date('2026-09-17T17:00:00Z').getTime();

export async function getReservations(filters = {}) {
  if (API_BASE_URL) {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/reservations?${params}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
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

  // Sort by scheduledStartTime ascending
  result.sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime));

  return result;
}

export async function getReservationById(id) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 200));
  const res = localReservations.find((r) => r.id === id);
  if (!res) throw new Error('Reservation not found');
  return { ...res };
}

export async function createReservation(data) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 450));

  // 1. Business Rule: Enforce 7-day forward horizon
  const startTime = new Date(data.scheduledStartTime).getTime();
  const maxAllowedTime = NOW_MS + 7 * 24 * 60 * 60 * 1000;

  if (startTime > maxAllowedTime) {
    const err = new Error(
      'Scheduling Violation: Energy reservations cannot be scheduled more than 7 days in advance. Please select an operating slot within the next 7 days.'
    );
    err.code = 'SEVEN_DAY_LIMIT_EXCEEDED';
    throw err;
  }

  if (startTime < NOW_MS) {
    const err = new Error('Scheduling Violation: Reservation start time cannot be in the past.');
    err.code = 'PAST_DATE_ERROR';
    throw err;
  }

  const newReservation = {
    id: `RES-2026-${String(localReservations.length + 1).padStart(3, '0')}`,
    prosumerNic: data.prosumerNic,
    prosumerName: data.prosumerName || 'Kasun Perera',
    nodeId: data.nodeId,
    nodeName: data.nodeName || 'North Sector Substation A',
    slotNumber: parseInt(data.slotNumber, 10) || 1,
    transferType: data.transferType || 'Inject',
    scheduledStartTime: data.scheduledStartTime,
    scheduledEndTime: data.scheduledEndTime,
    energyAmountKwh: parseFloat(data.energyAmountKwh) || 20.0,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localReservations.unshift(newReservation);
  return newReservation;
}

export async function cancelReservation(id, reason = '') {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 400));
  const res = localReservations.find((r) => r.id === id);
  if (!res) throw new Error('Reservation not found');

  // 2. Business Rule: 12-Hour Cancellation Notice
  const startTime = new Date(res.scheduledStartTime).getTime();
  const diffHours = (startTime - NOW_MS) / (1000 * 60 * 60);

  if (diffHours < 12 && diffHours >= 0) {
    const err = new Error(
      `Cancellation Prohibited: Under system trading rules, reservations cannot be cancelled or modified within 12 hours of the scheduled transfer time. Only ${Math.max(0, Math.round(diffHours * 10) / 10)} hours remain until scheduled execution.`
    );
    err.code = 'TWELVE_HOUR_CANCELLATION_LOCK';
    err.remainingHours = diffHours;
    throw err;
  }

  res.status = 'Cancelled';
  res.cancellationReason = reason || 'Cancelled by user request';
  res.updatedAt = new Date().toISOString();
  return res;
}

export async function approveReservation(id) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const res = localReservations.find((r) => r.id === id);
  if (!res) throw new Error('Reservation not found');
  res.status = 'Approved';
  res.updatedAt = new Date().toISOString();
  return res;
}

export async function rejectReservation(id, reason) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const res = localReservations.find((r) => r.id === id);
  if (!res) throw new Error('Reservation not found');
  res.status = 'Cancelled';
  res.cancellationReason = reason || 'Rejected by Grid Operator';
  res.updatedAt = new Date().toISOString();
  return res;
}
