import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Pagination from '../../components/common/Pagination';
import { useNotification } from '../../context/NotificationContext';
import { getReservations, cancelReservation } from '../../services/reservationService';
import { getNodes } from '../../services/nodeService';

export default function ReservationsPage() {
  const { showSuccess, showError } = useNotification();
  const [reservations, setReservations] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nodeFilter, setNodeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resList, nodeList] = await Promise.all([
        getReservations(),
        getNodes(),
      ]);
      setReservations(resList);
      setNodes(nodeList);
    } catch {
      showError('Failed to load reservation ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.prosumerNic.toLowerCase().includes(search.toLowerCase()) ||
        r.prosumerName.toLowerCase().includes(search.toLowerCase()) ||
        r.nodeName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesNode = nodeFilter === 'All' || r.nodeId === nodeFilter;
      return matchesSearch && matchesStatus && matchesNode;
    });
  }, [reservations, search, statusFilter, nodeFilter]);

  const pageSize = 6;
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelReservation(cancelTarget.id, 'Cancelled by Backoffice Officer request');
      showSuccess(`Reservation ${cancelTarget.id} successfully cancelled.`);
      setCancelTarget(null);
      await fetchData();
    } catch (err) {
      setCancelError(err.message || 'API rejected cancellation.');
      showError(err.message || 'Cancellation rejected by business rule.');
    } finally {
      setIsCancelling(false);
    }
  };

  const columns = [
    {
      header: 'Reservation ID',
      accessor: 'id',
      render: (r) => (
        <Link
          to={`/backoffice/reservations/${r.id}`}
          className="font-monospace fw-semibold text-decoration-none"
        >
          {r.id}
        </Link>
      ),
    },
    {
      header: 'Prosumer',
      render: (r) => (
        <div>
          <div className="fw-semibold">{r.prosumerName}</div>
          <div className="font-monospace text-muted-custom small" style={{ fontSize: '0.72rem' }}>
            NIC: {r.prosumerNic}
          </div>
        </div>
      ),
    },
    {
      header: 'Substation & Bay',
      render: (r) => (
        <div>
          <div className="fw-semibold">{r.nodeName}</div>
          <div className="text-muted-custom small">Bay #{r.slotNumber}</div>
        </div>
      ),
    },
    {
      header: 'Transfer Type',
      render: (r) => (
        <span
          className={`badge ${
            r.transferType === 'Inject' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-info-subtle text-info-emphasis'
          }`}
        >
          <i className={`bi ${r.transferType === 'Inject' ? 'bi-box-arrow-in-down' : 'bi-box-arrow-up'} me-1`}></i>
          {r.transferType === 'Inject' ? 'Solar Injection' : 'Grid Draw'}
        </span>
      ),
    },
    {
      header: 'Scheduled Window',
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
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="d-flex gap-1">
          <Link
            to={`/backoffice/reservations/${r.id}`}
            className="btn btn-sm btn-outline-primary py-0 px-2"
            title="Inspect Lifecycle Record"
          >
            <i className="bi bi-eye"></i> Details
          </Link>
          {(r.status === 'Approved' || r.status === 'Pending') && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2"
              onClick={() => {
                setCancelTarget(r);
                setCancelError(null);
              }}
              title="Cancel Booking (Subject to 12-hour rule)"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Energy Reservation Ledger"
        description="Comprehensive audit of scheduled energy transfers, prosumer solar injection slots, and market allocations."
        breadcrumbItems={[
          { label: 'Market & Trading' },
          { label: 'Reservations' },
        ]}
      />

      {/* Strict Business Rules Banner */}
      <div className="alert alert-info py-2 px-3 mb-4 small d-flex align-items-center gap-2" role="note">
        <i className="bi bi-info-circle-fill fs-5 text-primary"></i>
        <div>
          <strong>System Governance Boundaries:</strong> Reservations are restricted to a forward{' '}
          <strong>7-Day Window</strong>. Cancellations or schedule modifications are strictly rejected by the
          Centralized C# API within <strong>12 Hours</strong> of scheduled execution.
        </div>
      </div>

      <FilterBar
        hasActiveFilters={search !== '' || statusFilter !== 'All' || nodeFilter !== 'All'}
        onReset={() => {
          setSearch('');
          setStatusFilter('All');
          setNodeFilter('All');
        }}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, Prosumer NIC, Name..."
        />
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
        >
          <option value="All">All Substations</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={paginatedReservations}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Reservations Found"
        emptyDescription="No energy transfers match your query."
      />

      <Pagination
        currentPage={currentPage}
        totalItems={filteredReservations.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Cancellation Modal With 12-Hour Rule Feedback */}
      {cancelTarget && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setCancelTarget(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="cancel-modal-title" className="h3 mb-0 text-danger">
                Cancel Energy Reservation {cancelTarget.id}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setCancelTarget(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              {cancelError ? (
                <div className="alert alert-danger d-flex align-items-start gap-2 mb-3 small" role="alert">
                  <i className="bi bi-clock-history fs-5 mt-1"></i>
                  <div>
                    <strong>Cancellation Locked by System Rule:</strong>
                    <div className="mt-1">{cancelError}</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-custom small mb-3">
                  Are you sure you want to cancel reservation <strong>{cancelTarget.id}</strong> for{' '}
                  <strong>{cancelTarget.prosumerName}</strong>? The API will verify if the 12-hour notice window
                  has elapsed before permitting cancellation.
                </p>
              )}

              <div className="alert alert-light border small text-muted-custom">
                <i className="bi bi-shield-lock me-1 text-primary"></i>
                <strong>12-Hour Rule Check:</strong> Transfers executing within 12 hours cannot be cancelled to
                protect grid frequency reliability.
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-danger-custom"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? 'Validating Notice Period...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
