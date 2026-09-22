import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { useNotification } from '../../context/NotificationContext';
import { getReservations } from '../../services/reservationService';
import { getNodes } from '../../services/nodeService';

export default function OperatorAllReservationsPage() {
  const { showError } = useNotification();
  const [reservations, setReservations] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nodeFilter, setNodeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [inspectTarget, setInspectTarget] = useState(null);

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
      showError('Failed to fetch energy transfer ledger.');
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
  const paginated = filteredReservations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      header: 'Transfer ID',
      accessor: 'id',
      render: (r) => <span className="font-monospace fw-semibold">{r.id}</span>,
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
      header: 'Dispatch State',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      render: (r) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 px-2"
          onClick={() => setInspectTarget(r)}
        >
          <i className="bi bi-eye me-1"></i> Telemetry
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dispatched Energy Ledger"
        description="Comprehensive dispatch audit log for all scheduled, completed, and cancelled microgrid transfers."
      />

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
          placeholder="Filter transfers..."
        />
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Dispatch States</option>
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
        data={paginated}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Transfers Found"
        emptyDescription="No reservations match your filters."
      />

      <Pagination
        currentPage={currentPage}
        totalItems={filteredReservations.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Detail Modal */}
      {inspectTarget && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setInspectTarget(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="op-ledger-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="op-ledger-title" className="h3 mb-0">
                Dispatch Record: {inspectTarget.id}
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
                  <span className="text-muted-custom">Prosumer NIC</span>
                  <span className="font-monospace fw-semibold">{inspectTarget.prosumerNic}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Substation</span>
                  <span className="fw-semibold">{inspectTarget.nodeName}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Assigned Bay</span>
                  <span>Bay #{inspectTarget.slotNumber}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Energy Volume</span>
                  <span className="fw-bold text-success">{inspectTarget.energyAmountKwh} kWh</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Execution Start</span>
                  <span>{new Date(inspectTarget.scheduledStartTime).toLocaleString()}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Execution End</span>
                  <span>{new Date(inspectTarget.scheduledEndTime).toLocaleString()}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted-custom">Status</span>
                  <StatusBadge status={inspectTarget.status} />
                </div>
                {inspectTarget.cancellationReason && (
                  <div className="list-group-item px-0 py-2 text-danger">
                    <strong>Cancellation Note:</strong> {inspectTarget.cancellationReason}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setInspectTarget(null)}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
