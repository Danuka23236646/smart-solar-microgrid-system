import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';
import {
  getReservations,
  approveReservation,
  rejectReservation,
} from '../../services/reservationService';

export default function OperatorPendingReservationsPage() {
  const { showSuccess, showError } = useNotification();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Confirmation dialog state
  const [actionTarget, setActionTarget] = useState(null); // { type: 'approve' | 'reject', res }
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [inspectTarget, setInspectTarget] = useState(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const data = await getReservations({ status: 'Pending' });
      setReservations(data);
    } catch {
      showError('Failed to fetch pending transfer reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const filteredPending = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.prosumerName.toLowerCase().includes(search.toLowerCase()) ||
        r.nodeName.toLowerCase().includes(search.toLowerCase())
    );
  }, [reservations, search]);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      if (actionTarget.type === 'approve') {
        await approveReservation(actionTarget.res.id);
        showSuccess(`Reservation ${actionTarget.res.id} approved and dispatched.`);
      } else {
        await rejectReservation(actionTarget.res.id, rejectReason || 'Rejected by Grid Operator');
        showSuccess(`Reservation ${actionTarget.res.id} rejected.`);
      }
      setActionTarget(null);
      setRejectReason('');
      await fetchPending();
    } catch (err) {
      showError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Reservation ID',
      accessor: 'id',
      render: (r) => <span className="font-monospace fw-semibold text-primary">{r.id}</span>,
    },
    {
      header: 'Target Substation',
      render: (r) => (
        <div>
          <span className="fw-semibold">{r.nodeName}</span>
          <div className="text-muted-custom small">Bay #{r.slotNumber}</div>
        </div>
      ),
    },
    {
      header: 'Transfer Direction',
      render: (r) => (
        <span
          className={`badge ${
            r.transferType === 'Inject' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-info-subtle text-info-emphasis'
          }`}
        >
          {r.transferType === 'Inject' ? 'Solar Ingestion' : 'Grid Draw'}
        </span>
      ),
    },
    {
      header: 'Scheduled Time',
      render: (r) => (
        <span className="small">
          {new Date(r.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      header: 'Volume',
      render: (r) => <span className="fw-semibold">{r.energyAmountKwh} kWh</span>,
    },
    {
      header: 'Validation Actions',
      render: (r) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={() => setInspectTarget(r)}
          >
            <i className="bi bi-eye"></i> Details
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-success py-0 px-2"
            onClick={() => setActionTarget({ type: 'approve', res: r })}
          >
            <i className="bi bi-check2"></i> Approve
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger py-0 px-2"
            onClick={() => {
              setActionTarget({ type: 'reject', res: r });
              setRejectReason('');
            }}
          >
            <i className="bi bi-x"></i> Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pending Transfer Validations"
        description="Verify microgrid battery slot capacity and validate prosumer energy dispatch requests."
        actions={
          <span className="badge bg-warning text-dark px-3 py-2 fs-6">
            <i className="bi bi-hourglass-split me-1"></i> {reservations.length} Pending Approvals
          </span>
        }
      />

      <FilterBar hasActiveFilters={search !== ''} onReset={() => setSearch('')}>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, Prosumer, Substation..."
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredPending}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Pending Reservations"
        emptyDescription="All forward energy transfers have been processed."
        emptyIcon="bi-check2-circle"
      />

      {/* Inspect Modal */}
      {inspectTarget && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setInspectTarget(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="op-res-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="op-res-modal-title" className="h3 mb-0">
                Transfer Details: {inspectTarget.id}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setInspectTarget(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              <div className="list-group list-group-flush small">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Prosumer Applicant</span>
                  <span className="fw-semibold">{inspectTarget.prosumerName}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Prosumer NIC</span>
                  <span className="font-monospace">{inspectTarget.prosumerNic}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Target Substation</span>
                  <span className="fw-semibold">{inspectTarget.nodeName}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Modular Storage Bay</span>
                  <span className="badge text-bg-light border">Bay #{inspectTarget.slotNumber}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Transfer Scheduled</span>
                  <span>{new Date(inspectTarget.scheduledStartTime).toLocaleString()}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Contracted Volume</span>
                  <span className="fw-bold text-success">{inspectTarget.energyAmountKwh} kWh</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setInspectTarget(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-success-custom"
                onClick={() => {
                  const r = inspectTarget;
                  setInspectTarget(null);
                  setActionTarget({ type: 'approve', res: r });
                }}
              >
                Approve Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject Dialog */}
      <ConfirmationDialog
        isOpen={!!actionTarget}
        title={actionTarget?.type === 'approve' ? 'Approve Energy Transfer' : 'Reject Transfer Request'}
        message={
          actionTarget?.type === 'approve'
            ? `Confirm approval for transfer ${actionTarget?.res.id} (${actionTarget?.res.energyAmountKwh} kWh). This will lock Bay #${actionTarget?.res.slotNumber} at ${actionTarget?.res.nodeName}.`
            : `Are you sure you want to reject transfer ${actionTarget?.res.id}?`
        }
        confirmLabel={actionTarget?.type === 'approve' ? 'Authorize Transfer' : 'Reject Request'}
        confirmVariant={actionTarget?.type === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleActionConfirm}
        onCancel={() => setActionTarget(null)}
      >
        {actionTarget?.type === 'reject' && (
          <div className="mt-3">
            <label className="field-label" htmlFor="rejectReason">
              Operational Rejection Reason <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="rejectReason"
              className="form-control"
              placeholder="e.g. Substation thermal overload warning"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
