import { API_BASE_URL, getAuthHeaders, handleApiResponse, isOfflineOrDbError } from './apiConfig';

let localSchedules = [];

import { getNodeById } from './nodeService';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayMap = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export async function getNodeSchedules(nodeId) {
  try {
    const station = await getNodeById(nodeId);
    if (station && Array.isArray(station.operatingSchedule) && station.operatingSchedule.length > 0) {
      return station.operatingSchedule.map((s) => {
        const dayStr = typeof s.dayOfWeek === 'number' ? dayNames[s.dayOfWeek] : s.dayOfWeek;
        return {
          id: `${nodeId}-${s.dayOfWeek}`,
          nodeId,
          dayOfWeek: dayStr,
          startTime: s.openingTime || '08:00',
          endTime: s.closingTime || '18:00',
          isClosed: s.isClosed || false,
          status: s.isClosed ? 'Closed' : 'Available',
          mode: 'Active Injection & Draw',
        };
      });
    }
    return localSchedules.filter((s) => s.nodeId === nodeId);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      await new Promise((r) => setTimeout(r, 200));
      return localSchedules.filter((s) => s.nodeId === nodeId);
    }
    throw err;
  }
}

export async function updateNodeSchedule(nodeId, scheduleEntries) {
  try {
    const station = await getNodeById(nodeId);
    const stationId = station?.id || nodeId;

    const operatingSchedule = scheduleEntries.map((e) => {
      const dayVal = typeof e.dayOfWeek === 'string' && dayMap[e.dayOfWeek] !== undefined
        ? dayMap[e.dayOfWeek]
        : (parseInt(e.dayOfWeek, 10) || 0);
      return {
        dayOfWeek: dayVal,
        openingTime: e.startTime || e.openingTime || '08:00',
        closingTime: e.endTime || e.closingTime || '18:00',
        isClosed: e.isClosed || e.status === 'Closed' || false,
      };
    });

    const response = await fetch(`${API_BASE_URL}/stations/${stationId}/schedule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ operatingSchedule }),
    });
    await handleApiResponse(response);
    return getNodeSchedules(stationId);
  } catch (err) {
    if (isOfflineOrDbError(err)) {
      localSchedules = localSchedules.filter((s) => s.nodeId !== nodeId);
      scheduleEntries.forEach((entry) => {
        localSchedules.push({ ...entry, nodeId });
      });
      return localSchedules.filter((s) => s.nodeId === nodeId);
    }
    throw err;
  }
}
