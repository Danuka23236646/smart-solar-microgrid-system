import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { initialNodeSchedules } from './mockData';

let localSchedules = [...initialNodeSchedules];

export async function getNodeSchedules(nodeId) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/schedules`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 250));
  return localSchedules.filter((s) => s.nodeId === nodeId);
}

export async function updateNodeSchedule(nodeId, scheduleEntries) {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/schedules`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleEntries),
    });
    return handleApiResponse(response);
  }

  await new Promise((r) => setTimeout(r, 350));
  localSchedules = localSchedules.filter((s) => s.nodeId !== nodeId);
  scheduleEntries.forEach((entry) => {
    localSchedules.push({ ...entry, nodeId });
  });
  return localSchedules.filter((s) => s.nodeId === nodeId);
}
