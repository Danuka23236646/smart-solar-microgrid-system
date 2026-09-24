import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';
import { getNodeById } from './nodeService';

let localSlots = {};

export function getStoredOverrides() {
  try {
    return JSON.parse(localStorage.getItem('solargrid_slot_overrides') || '{}');
  } catch {
    return {};
  }
}

export function saveStoredOverrides(overrides) {
  try {
    localStorage.setItem('solargrid_slot_overrides', JSON.stringify(overrides));
  } catch {}
}

export async function getBatterySlots(nodeId) {
  try {
    const station = await getNodeById(nodeId);
    const stationId = station?.id || nodeId;
    const totalCount = station?.totalSlots || station?.totalBatteryStorageSlots || 8;

    let slotItems = [];
    try {
      const response = await fetch(`${API_BASE_URL}/stations/${stationId}/slots?includePast=false`, {
        headers: getAuthHeaders(),
      });
      const result = await handleApiResponse(response);
      slotItems = Array.isArray(result) ? result : [];
    } catch {
      // Station slots query fallback
    }

    // Determine how many bays are currently reserved from active booking slot capacity
    let reservedBaysCount = 0;
    let activeSlotId = null;
    if (slotItems.length > 0) {
      const activeSlot = slotItems[0];
      activeSlotId = activeSlot.id;
      const slotTotal = activeSlot.totalCapacity || totalCount;
      const slotAvail = typeof activeSlot.availableCapacity === 'number' ? activeSlot.availableCapacity : totalCount;
      reservedBaysCount = Math.max(0, slotTotal - slotAvail);
    }

    const perBayCapacity = Math.round((station?.capacityKw || station?.storageCapacityKwh || 100) / totalCount);

    const resultSlots = [];
    for (let i = 1; i <= totalCount; i++) {
      const isReserved = i <= reservedBaysCount;
      resultSlots.push({
        id: `${stationId}-slot-${i}`,
        slotNumber: i,
        bayCode: `BAY-${String(i).padStart(2, '0')}`,
        hardwareId: `${station?.stationCode || 'NODE'}-BAY-${String(i).padStart(2, '0')}`,
        stationId,
        bookingSlotId: activeSlotId,
        totalCapacity: perBayCapacity,
        availableCapacity: isReserved ? 0 : perBayCapacity,
        soc: isReserved ? 100 : 100,
        tempC: 25,
        status: isReserved ? 'Reserved' : 'Available',
        lastUpdated: new Date().toISOString(),
      });
    }

    // Apply any persistent manual overrides stored for this station
    const allOverrides = getStoredOverrides();
    const stationOverrides = allOverrides[stationId] || allOverrides[nodeId] || (station?.stationCode ? allOverrides[station.stationCode] : null) || {};

    resultSlots.forEach((slot) => {
      const ov = stationOverrides[slot.slotNumber] || stationOverrides[String(slot.slotNumber)] || stationOverrides[slot.id];
      if (ov) {
        slot.status = ov.status;
        slot.reason = ov.reason || slot.reason;
        slot.lastUpdated = ov.updatedAt || slot.lastUpdated;
        if (ov.status === 'Unavailable' || ov.status === 'Maintenance') {
          slot.availableCapacity = 0;
          slot.soc = 0;
          slot.tempC = 0;
        } else if (ov.status === 'Available') {
          slot.availableCapacity = slot.totalCapacity || perBayCapacity;
          slot.soc = 100;
          slot.tempC = 25;
        }
      }
    });

    return resultSlots;
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
      return [...(localSlots[nodeId] || [])];
    }
    throw err;
  }
}

export async function updateBatterySlotStatus(nodeId, slotNumberOrId, newStatus, reason = '') {
  try {
    const station = await getNodeById(nodeId);
    const stationId = station?.id || nodeId;
    const slots = await getBatterySlots(nodeId);
    const target = slots.find(
      (s) => s.slotNumber == slotNumberOrId || String(s.slotNumber) === String(slotNumberOrId) || s.id === String(slotNumberOrId)
    );
    const slotId = target?.bookingSlotId || target?.id;
    const slotNumber = target?.slotNumber ?? slotNumberOrId;

    // 1. If real MongoDB ObjectId, attempt API update
    if (slotId && /^[a-fA-F0-9]{24}$/.test(slotId)) {
      try {
        if (newStatus === 'Unavailable' || newStatus === 'Maintenance') {
          await fetch(`${API_BASE_URL}/booking-slots/${slotId}/availability`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ availableCapacity: 0 }),
          });
        } else {
          await fetch(`${API_BASE_URL}/booking-slots/${slotId}/reopen`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
          });
        }
      } catch (apiErr) {
        console.warn('API slot availability update warning:', apiErr);
      }
    }

    // 2. Persist override in localStorage so it remains across pages & reloads
    const allOverrides = getStoredOverrides();
    if (!allOverrides[stationId]) allOverrides[stationId] = {};
    allOverrides[stationId][String(slotNumber)] = {
      status: newStatus,
      reason,
      updatedAt: new Date().toISOString(),
    };

    if (nodeId && nodeId !== stationId) {
      if (!allOverrides[nodeId]) allOverrides[nodeId] = {};
      allOverrides[nodeId][String(slotNumber)] = allOverrides[stationId][String(slotNumber)];
    }

    if (station?.stationCode) {
      if (!allOverrides[station.stationCode]) allOverrides[station.stationCode] = {};
      allOverrides[station.stationCode][String(slotNumber)] = allOverrides[stationId][String(slotNumber)];
    }

    saveStoredOverrides(allOverrides);

    // 3. Update in-memory local fallback
    if (!localSlots[nodeId]) localSlots[nodeId] = [];
    const localSlot = localSlots[nodeId].find((s) => s.slotNumber === slotNumber || s.id === slotId);
    if (localSlot) {
      localSlot.status = newStatus;
      localSlot.reason = reason;
      localSlot.lastUpdated = new Date().toISOString();
    } else {
      localSlots[nodeId].push({
        slotNumber,
        status: newStatus,
        reason,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Dispatch a storage event so all pages/tabs react in real time
    window.dispatchEvent(new Event('solargrid_slots_updated'));

    return { slotNumber, status: newStatus, reason };
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      const allOverrides = getStoredOverrides();
      if (!allOverrides[nodeId]) allOverrides[nodeId] = {};
      allOverrides[nodeId][String(slotNumberOrId)] = {
        status: newStatus,
        reason,
        updatedAt: new Date().toISOString(),
      };
      saveStoredOverrides(allOverrides);
      return { slotNumber: slotNumberOrId, status: newStatus, reason };
    }
    throw err;
  }
}
