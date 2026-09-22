import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';
import { getProsumers, approveProsumer, rejectProsumer } from '../../services/prosumerService';

export default function PendingActivationsPage() {
  const { showSuccess, showError } = useNotification();
  const [prosumers, setProsumers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [confirmModal, setConfirmModal] = useState(null); // { type: 'approve'|'reject', prosumer }
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [inspectTarget, setInspectTarget] = useState(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const data = await getProsumers({ status: 'Pending' });
      setProsumers(data);
    } catch {
      showError('Failed to fetch pending activation queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const filteredPending = useMemo(() => {
    return prosumers.filter(
      (p) =>
        p.nic.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [prosumers, search]);

  const handleActionConfirm = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      if (confirmModal.type === 'approve') {
        await approveProsumer(confirmModal.prosumer.nic);
        showSuccess(`Prosumer ${confirmModal.prosumer.name} approved.`);
      } else {
        await rejectProsumer(confirmModal.prosumer.nic, rejectionReason || 'Documentation rejected');
        showSuccess(`Application for ${confirmModal.prosumer.name} rejected.`);
      }
      setConfirmModal(null);
      setRejectionReason('');
      await fetchPending();
    } catch (err) {
      showError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Application Date',
      accessor: 'registeredDate',
      render: (p) => <span className="small text-muted-custom">{p.registeredDate}</span>,
    },
    {
      header: 'NIC Number',
      accessor: 'nic',
      render: (p) => <span className="font-monospace fw-semibold text-primary">{p.nic}</span>,
    },
    {
      header: 'Applicant Full Name',
      accessor: 'name',
      render: (p) => <span className="fw-semibold">{p.name}</span>,
    },
    { header: 'Contact Telephone', accessor: 'contact' },
    {
      header: 'Solar Generation Capacity',
      render: (p) => <span className="badge text-bg-warning">{p.solarCapacityKw} kW</span>,
    },
    {
      header: 'Verification Actions',
      render: (p) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={() => setInspectTarget(p)}
          >
            <i className="bi bi-eye"></i> Details
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-success py-0 px-2"
            onClick={() => setConfirmModal({ type: 'approve', prosumer: p })}
          >
            <i className="bi bi-check-circle me-1"></i> Approve
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger py-0 px-2"
            onClick={() => {
              setConfirmModal({ type: 'reject', prosumer: p });
              setRejectionReason('');
            }}
          >
            <i className="bi bi-x-circle me-1"></i> Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pending Prosumer Activations"
        description="Verify submitted prosumer documentation and authorize microgrid market participation."
        breadcrumbItems={[
          { label: 'Prosumers', path: '/backoffice/prosumers' },
          { label: 'Pending Verification Queue' },
        ]}
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark px-3 py-2 fs-6">
              <i className="bi bi-hourglass-split me-1"></i> {prosumers.length} Awaiting Review
            </span>
          </div>
        }
      />

      <FilterBar hasActiveFilters={search !== ''} onReset={() => setSearch('')}>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Filter by NIC or Applicant Name..."
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredPending}
        keyField="nic"
        isLoading={isLoading}
        emptyTitle="Pending Queue is Clear"
        emptyDescription="There are currently no prosumer registration requests awaiting administrative verification."
        emptyIcon="bi-check2-circle"
      />

      {/* Inspect Applicant Modal */}
      {inspectTarget && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setInspectTarget(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicant-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="applicant-modal-title" className="h3 mb-0">
                Applicant Documentation: {inspectTarget.name}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setInspectTarget(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              <div className="list-group list-group-flush border-top border-bottom small mb-3">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Applicant NIC</span>
                  <span className="font-monospace fw-bold">{inspectTarget.nic}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Phone Number</span>
                  <span>{inspectTarget.contact}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Email Address</span>
                  <span>{inspectTarget.email}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Facility Address</span>
                  <span className="text-end" style={{ maxWidth: '60%' }}>{inspectTarget.address}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Rooftop Solar Peak Rating</span>
                  <span className="fw-semibold text-warning">{inspectTarget.solarCapacityKw} kW</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Submission Date</span>
                  <span>{inspectTarget.registeredDate}</span>
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
                  const p = inspectTarget;
                  setInspectTarget(null);
                  setConfirmModal({ type: 'approve', prosumer: p });
                }}
              >
                Approve Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!confirmModal}
        title={confirmModal?.type === 'approve' ? 'Approve Prosumer Registration' : 'Reject Prosumer Registration'}
        message={
          confirmModal?.type === 'approve'
            ? `Confirm authorization for applicant ${confirmModal?.prosumer.name} (${confirmModal?.prosumer.nic}). Once approved, the prosumer can schedule forward solar microgrid reservations.`
            : `Are you sure you want to reject the registration for applicant ${confirmModal?.prosumer.name}?`
        }
        confirmLabel={confirmModal?.type === 'approve' ? 'Authorize Prosumer' : 'Confirm Rejection'}
        confirmVariant={confirmModal?.type === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleActionConfirm}
        onCancel={() => setConfirmModal(null)}
      >
        {confirmModal?.type === 'reject' && (
          <div className="mt-3">
            <label className="field-label" htmlFor="rejectionReasonInput">
              Reason for Rejection (Required) <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="rejectionReasonInput"
              className="form-control"
              placeholder="e.g. Unverified electrical compliance document."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
