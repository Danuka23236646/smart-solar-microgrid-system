import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';

/**
 * Verify a scanned QR payload (e.g. SUNGRID:<token>) against backend state and transfer window.
 * Role: GridOperator
 */
export async function verifyQr(qrPayload) {
  const response = await fetch(`${API_BASE_URL}/qr/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ qrPayload: qrPayload.trim() }),
  });
  return handleApiResponse(response);
}

/**
 * Finalize and record actual transfer energy amount using the scanned QR payload.
 * Role: GridOperator
 */
export async function completeEnergyTransfer(qrPayload, actualEnergyAmountKwh, completionNotes = '') {
  const response = await fetch(`${API_BASE_URL}/qr/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      qrPayload: qrPayload.trim(),
      actualEnergyAmountKwh: parseFloat(actualEnergyAmountKwh),
      completionNotes: completionNotes ? completionNotes.trim() : null,
    }),
  });
  return handleApiResponse(response);
}

/**
 * Generates or regenerates a cryptographic QR payload string for an Approved reservation.
 * Role: Prosumer
 */
export async function generateQr(reservationId) {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/qr`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
}

/**
 * Retrieves safe metadata regarding QR issuance and validity status without raw secrets.
 * Role: Prosumer
 */
export async function getQrStatus(reservationId) {
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/qr/status`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
}
