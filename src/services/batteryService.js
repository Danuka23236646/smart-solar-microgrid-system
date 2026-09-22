import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialBatterySlots } from './mockData';

let localSlots = JSON.parse(JSON.stringify(initialBatterySlots));

export async function getBatterySlots(nodeId) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/battery-slots`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 300));
  return [...(localSlots[nodeId] || [])];
}

export async function updateBatterySlotStatus(nodeId, slotNumber, newStatus, reason = '') {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/battery-slots/${slotNumber}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus, reason }),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  const nodeSlots = localSlots[nodeId];
  if (!nodeSlots) throw new Error(`Node ${nodeId} not found`);

  const slot = nodeSlots.find((s) => s.slotNumber === slotNumber);
  if (!slot) throw new Error(`Slot #${slotNumber} not found on node ${nodeId}`);

  // If currently reserved, check if it can be overridden
  if (slot.status === 'Reserved' && newStatus === 'Unavailable') {
    // Flag reason
    slot.status = 'Unavailable';
    slot.reason = reason || 'Emergency maintenance override by operator';
  } else {
    slot.status = newStatus;
    if (newStatus === 'Unavailable') {
      slot.reason = reason || 'Maintenance / Calibration';
    } else {
      delete slot.reason;
    }
  }

  slot.lastUpdated = new Date().toISOString();
  return slot;
}
