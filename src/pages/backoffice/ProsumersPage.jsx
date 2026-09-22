import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Pagination from '../../components/common/Pagination';
import { useNotification } from '../../context/NotificationContext';
import {
  getProsumers,
  createProsumer,
  updateProsumer,
  deactivateProsumer,
  reactivateProsumer,
} from '../../services/prosumerService';

export default function ProsumersPage() {
  const { showSuccess, showError } = useNotification();
  const [prosumers, setProsumers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectProsumer, setInspectProsumer] = useState(null);
  const [editingProsumer, setEditingProsumer] = useState(null);
  const [formState, setFormState] = useState({
    nic: '',
    name: '',
    contact: '',
    email: '',
    address: '',
    solarCapacityKw: '5.0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destructive / Action Dialogs
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [reactivationJustification, setReactivationJustification] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProsumers = async () => {
    setIsLoading(true);
    try {
      const data = await getProsumers();
      setProsumers(data);
    } catch {
      showError('Failed to load prosumer directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProsumers();
  }, []);

  const filteredProsumers = useMemo(() => {
    return prosumers.filter((p) => {
      const matchesSearch =
        p.nic.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prosumers, search, statusFilter]);

  const pageSize = 5;
  const paginatedProsumers = filteredProsumers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreateModal = () => {
    setEditingProsumer(null);
    setFormState({
      nic: '',
      name: '',
      contact: '',
      email: '',
      address: '',
      solarCapacityKw: '5.0',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProsumer(p);
    setFormState({
      nic: p.nic,
      name: p.name,
      contact: p.contact,
      email: p.email,
      address: p.address,
      solarCapacityKw: String(p.solarCapacityKw || 5.0),
    });
    setIsCreateOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProsumer) {
        await updateProsumer(editingProsumer.nic, formState);
        showSuccess(`Prosumer ${formState.name} updated successfully.`);
      } else {
        await createProsumer(formState);
        showSuccess(`Prosumer ${formState.name} enrolled with NIC ${formState.nic}.`);
      }
      setIsCreateOpen(false);
      await fetchProsumers();
    } catch (err) {
      showError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await deactivateProsumer(deactivateTarget.nic, 'Administrative deactivation by Backoffice');
      showSuccess(`Prosumer account for ${deactivateTarget.name} deactivated.`);
      setDeactivateTarget(null);
      await fetchProsumers();
    } catch (err) {
      showError(err.message || 'Deactivation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivateTarget || !reactivationJustification.trim()) {
      showError('Justification note is required by API for reactivation.');
      return;
    }
    setActionLoading(true);
    try {
      await reactivateProsumer(reactivateTarget.nic, reactivationJustification.trim());
      showSuccess(`Prosumer ${reactivateTarget.name} successfully reactivated.`);
      setReactivateTarget(null);
      setReactivationJustification('');
      await fetchProsumers();
    } catch (err) {
      showError(err.message || 'Reactivation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'NIC (Primary Key)',
      accessor: 'nic',
      render: (p) => (
        <span className="font-monospace fw-semibold text-primary">{p.nic}</span>
      ),
    },
    {
      header: 'Prosumer Name',
      accessor: 'name',
      render: (p) => (
        <div>
          <span className="fw-semibold">{p.name}</span>
          <div className="text-muted-custom small">{p.email}</div>
        </div>
      ),
    },
    { header: 'Contact Telephone', accessor: 'contact' },
    {
      header: 'Solar Rating',
      render: (p) => <span className="badge text-bg-light border">{p.solarCapacityKw} kW</span>,
    },
    {
      header: 'Account Status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary py-0 px-2"
            onClick={() => setInspectProsumer(p)}
            title="Inspect Details"
          >
            <i className="bi bi-eye me-1"></i> View
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={() => openEditModal(p)}
            title="Edit Contact"
          >
            <i className="bi bi-pencil"></i>
          </button>
          {p.status === 'Active' ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2"
              onClick={() => setDeactivateTarget(p)}
              title="Deactivate Account"
            >
              Deactivate
            </button>
          ) : p.status === 'Inactive' || p.status === 'Deactivation Requested' ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-success py-0 px-2"
              onClick={() => {
                setReactivateTarget(p);
                setReactivationJustification('');
              }}
              title="Reactivate Account (Authorized Backoffice only)"
            >
              Reactivate
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Prosumer Directory"
        description="Search, audit, and regulate decentralized solar energy prosumers by NIC."
        actions={
          <button type="button" onClick={openCreateModal} className="btn-primary-custom">
            <i className="bi bi-person-plus-fill me-1"></i> Register Prosumer
          </button>
        }
      />

      <FilterBar
        hasActiveFilters={search !== '' || statusFilter !== 'All'}
        onReset={() => {
          setSearch('');
          setStatusFilter('All');
        }}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by NIC or Name..."
        />
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
          <option value="Deactivation Requested">Deactivation Requested</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={paginatedProsumers}
        keyField="nic"
        isLoading={isLoading}
        emptyTitle="No Prosumers Found"
        emptyDescription="No records match your query."
        rowClassName={(p) => (p.status === 'Deactivation Requested' ? 'table-warning' : '')}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={filteredProsumers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Inspect Side Modal / Drawer */}
      {inspectProsumer && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setInspectProsumer(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prosumer-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="prosumer-details-title" className="h3 mb-0">
                Prosumer Record: {inspectProsumer.nic}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setInspectProsumer(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="h4 mb-0">{inspectProsumer.name}</h4>
                <StatusBadge status={inspectProsumer.status} />
              </div>
              <div className="list-group list-group-flush border-top border-bottom small mb-3">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">National Identity Card (NIC)</span>
                  <span className="font-monospace fw-semibold">{inspectProsumer.nic}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Contact Telephone</span>
                  <span className="fw-semibold">{inspectProsumer.contact}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Email Address</span>
                  <span>{inspectProsumer.email}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Registered Address</span>
                  <span className="text-end" style={{ maxWidth: '60%' }}>{inspectProsumer.address}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Solar Generation Rating</span>
                  <span className="fw-semibold text-warning">{inspectProsumer.solarCapacityKw} kW</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Enrollment Date</span>
                  <span>{inspectProsumer.registeredDate}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setInspectProsumer(null)}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Prosumer Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setIsCreateOpen(false)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prosumer-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="prosumer-form-title" className="h3 mb-0">
                {editingProsumer ? 'Edit Prosumer Profile' : 'Register New Prosumer'}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsCreateOpen(false)}
              ></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body-custom">
                <div className="mb-3">
                  <label className="field-label" htmlFor="prosumerNic">
                    National Identity Card (NIC) <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="prosumerNic"
                    className="form-control font-monospace"
                    placeholder="e.g. 198512345678"
                    value={formState.nic}
                    disabled={!!editingProsumer}
                    onChange={(e) => setFormState({ ...formState, nic: e.target.value })}
                    required
                  />
                  <span className="field-helper">Acts as primary immutable identifier in MongoDB.</span>
                </div>

                <div className="mb-3">
                  <label className="field-label" htmlFor="prosumerName">
                    Full Legal Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="prosumerName"
                    className="form-control"
                    placeholder="e.g. Kasun Perera"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="field-label" htmlFor="prosumerContact">
                      Contact Phone <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      id="prosumerContact"
                      className="form-control"
                      placeholder="077-1234567"
                      value={formState.contact}
                      onChange={(e) => setFormState({ ...formState, contact: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label" htmlFor="prosumerEmail">
                      Email Address <span className="required-star">*</span>
                    </label>
                    <input
                      type="email"
                      id="prosumerEmail"
                      className="form-control"
                      placeholder="name@email.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="field-label" htmlFor="prosumerAddress">
                    Residential / Generation Facility Address <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="prosumerAddress"
                    className="form-control"
                    rows={2}
                    placeholder="Street, City, Province"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="mb-2">
                  <label className="field-label" htmlFor="prosumerCapacity">
                    Rooftop Solar Peak Output (kW) <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    id="prosumerCapacity"
                    step="0.1"
                    min="0.5"
                    max="100"
                    className="form-control"
                    value={formState.solarCapacityKw}
                    onChange={(e) => setFormState({ ...formState, solarCapacityKw: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-secondary-custom"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingProsumer ? 'Save Updates' : 'Enrol Prosumer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deactivateTarget}
        title="Deactivate Prosumer Account"
        message={`Are you sure you want to deactivate prosumer ${deactivateTarget?.name} (NIC: ${deactivateTarget?.nic})? This will immediately suspend all future energy trading reservations.`}
        confirmLabel="Deactivate Account"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {/* Reactivation Dialog with Mandatory Justification Note */}
      {reactivateTarget && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setReactivateTarget(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reactivate-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="reactivate-modal-title" className="h3 mb-0">
                Authorize Account Reactivation
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setReactivateTarget(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              <p className="text-muted-custom small mb-3">
                You are about to restore active trading status for <strong>{reactivateTarget.name}</strong> (NIC:{' '}
                <code>{reactivateTarget.nic}</code>). Under compliance rules, an administrative justification is
                required by the Centralized C# API.
              </p>
              <div className="mb-2">
                <label className="field-label" htmlFor="reactivationNote">
                  Administrative Justification / Audit Note <span className="required-star">*</span>
                </label>
                <textarea
                  id="reactivationNote"
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Identity re-verification complete and billing dispute resolved."
                  value={reactivationJustification}
                  onChange={(e) => setReactivationJustification(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setReactivateTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-success-custom"
                disabled={actionLoading || !reactivationJustification.trim()}
                onClick={handleReactivate}
              >
                {actionLoading ? 'Processing...' : 'Authorize Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
