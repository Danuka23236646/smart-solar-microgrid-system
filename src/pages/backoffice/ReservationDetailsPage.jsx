import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getReservationById, cancelReservation } from '../../services/reservationService';

export default function ReservationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchRecord = async () => {
    setIsLoading(true);
    try {
      const data = await getReservationById(id);
      setReservation(data);
    } catch {
      showError('Unable to load reservation record.');
      navigate('/backoffice/reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelReservation(id, 'Cancelled via Reservation Details Page');
      showSuccess(`Reservation ${id} has been cancelled.`);
      await fetchRecord();
    } catch (err) {
      setCancelError(err.message || 'Cancellation rejected by API.');
      showError(err.message || 'Cannot cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !reservation) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // Calculate remaining hours to execution
  const executionTimeMs = new Date(reservation.scheduledStartTime).getTime();
  const nowMs = new Date('2026-09-17T17:00:00Z').getTime();
  const diffHours = (executionTimeMs - nowMs) / (1000 * 60 * 60);
  const isWithin12Hours = diffHours >= 0 && diffHours < 12;

  return (
    <div>
      <PageHeader
        title={`Reservation: ${reservation.id}`}
        description="Comprehensive audit trail and operational dispatch parameters."
        breadcrumbItems={[
          { label: 'Reservations', path: '/backoffice/reservations' },
          { label: reservation.id },
        ]}
        actions={
          (reservation.status === 'Approved' || reservation.status === 'Pending') && (
            <button
              type="button"
              className="btn-danger-custom"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? 'Checking Rules...' : 'Cancel Reservation'}
            </button>
          )
        }
      />

      {/* 12-Hour Lock Warning Banner */}
      {isWithin12Hours && (reservation.status === 'Approved' || reservation.status === 'Pending') && (
        <div className="alert alert-warning py-2 px-3 mb-4 small d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-shield-lock-fill fs-5 text-warning"></i>
          <div>
            <strong>12-Hour Cancellation Rule Active:</strong> Only{' '}
            <strong>{Math.max(0, Math.round(diffHours * 10) / 10)} hours</strong> remain until transfer execution.
            Under system rules, cancellations or modifications attempted on this record will be blocked by the API.
          </div>
        </div>
      )}

      {cancelError && (
        <div className="alert alert-danger py-2 px-3 mb-4 small" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i>
          <strong>API Rule Violation:</strong> {cancelError}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Entity Specs */}
        <div className="col-12 col-lg-7">
          <div className="content-card mb-4">
            <div className="content-card__header">
              <h2 className="content-card__title">Prosumer & Substation Routing</h2>
              <StatusBadge status={reservation.status} />
            </div>
            <div className="content-card__body">
              <div className="list-group list-group-flush small">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Prosumer Applicant</span>
                  <span className="fw-semibold">{reservation.prosumerName}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">National Identity Card (NIC)</span>
                  <span className="font-monospace fw-semibold">{reservation.prosumerNic}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Allocated Substation</span>
                  <Link to={`/backoffice/nodes/${reservation.nodeId}`} className="text-decoration-none fw-semibold">
                    {reservation.nodeName} ({reservation.nodeId})
                  </Link>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Modular Storage Bay</span>
                  <span className="badge text-bg-light border">Bay #{reservation.slotNumber}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Transfer Direction</span>
                  <span className="fw-semibold">
                    {reservation.transferType === 'Inject' ? 'Solar Ingestion into Battery' : 'Power Draw from Battery'}
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Contracted Volume</span>
                  <span className="fw-bold text-success fs-6">{reservation.energyAmountKwh} kWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Window & History */}
        <div className="col-12 col-lg-5">
          <div className="content-card mb-4">
            <div className="content-card__header">
              <h2 className="content-card__title">Scheduled Operational Window</h2>
            </div>
            <div className="content-card__body">
              <div className="mb-3">
                <div className="text-muted-custom small mb-1">Window Start Time</div>
                <div className="fs-6 fw-bold font-monospace">
                  {new Date(reservation.scheduledStartTime).toLocaleString()}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-muted-custom small mb-1">Window End Time</div>
                <div className="fs-6 fw-bold font-monospace">
                  {new Date(reservation.scheduledEndTime).toLocaleString()}
                </div>
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between text-muted-custom small mb-1">
                  <span>Record Created:</span>
                  <span>{new Date(reservation.createdAt).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between text-muted-custom small">
                  <span>Last Updated:</span>
                  <span>{new Date(reservation.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {reservation.cancellationReason && (
                <div className="alert alert-danger py-2 px-3 mt-3 small mb-0">
                  <strong>Cancellation Reason:</strong> {reservation.cancellationReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
