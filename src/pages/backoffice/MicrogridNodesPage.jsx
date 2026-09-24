import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';
import { getNodes, deactivateNode, reactivateNode } from '../../services/nodeService';

export default function MicrogridNodesPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Deactivation State & Error feedback
  const [nodeToDeactivate, setNodeToDeactivate] = useState(null);
  const [deactivationError, setDeactivationError] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivatingId, setIsReactivatingId] = useState(null);

  const fetchNodes = async () => {
    setIsLoading(true);
    try {
      const data = await getNodes();
      setNodes(data);
    } catch {
      showError('Failed to fetch microgrid node fleet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();

    const handleSlotsUpdated = () => {
      fetchNodes();
    };
    window.addEventListener('solargrid_slots_updated', handleSlotsUpdated);
    return () => {
      window.removeEventListener('solargrid_slots_updated', handleSlotsUpdated);
    };
  }, []);

  const handleReactivate = async (node) => {
    setIsReactivatingId(node.id);
    try {
      await reactivateNode(node.id);
      showSuccess(`Substation ${node.name} successfully activated.`);
      await fetchNodes();
    } catch (err) {
      showError(err.message || 'Failed to activate node.');
    } finally {
      setIsReactivatingId(null);
    }
  };

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch =
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.id.toLowerCase().includes(search.toLowerCase()) ||
        n.address.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || n.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, search, statusFilter]);

  const handleDeactivateConfirm = async () => {
    if (!nodeToDeactivate) return;
    setIsDeactivating(true);
    setDeactivationError(null);
    try {
      await deactivateNode(nodeToDeactivate.id);
      showSuccess(`Substation ${nodeToDeactivate.name} deactivated.`);
      setNodeToDeactivate(null);
      await fetchNodes();
    } catch (err) {
      setDeactivationError(err.message || 'API rejected deactivation request.');
      showError('API Violation: Node deactivation prohibited.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const columns = [
    {
      header: 'Node ID',
      accessor: 'id',
      render: (n) => (
        <Link to={`/backoffice/nodes/${n.id}`} className="font-monospace fw-semibold text-decoration-none">
          {n.id}
        </Link>
      ),
    },
    {
      header: 'Substation Name & Location',
      render: (n) => (
        <div>
          <div className="fw-semibold">{n.name}</div>
          <div className="text-muted-custom small text-truncate" style={{ maxWidth: '280px' }}>
            {n.address}
          </div>
        </div>
      ),
    },
    {
      header: 'GPS Telemetry',
      render: (n) => (
        <span className="font-monospace small text-muted-custom">
          {n.latitude.toFixed(4)}, {n.longitude.toFixed(4)}
        </span>
      ),
    },
    {
      header: 'Power Capacity',
      render: (n) => (
        <div>
          <span className="fw-semibold">{n.capacityKw} kW</span>
          <span className="text-muted-custom small d-block">{n.storageCapacityKwh} kWh Storage</span>
        </div>
      ),
    },
    {
      header: 'Battery Slots',
      render: (n) => (
        <Link
          to={`/backoffice/nodes/${n.id}/battery-slots`}
          className="badge text-bg-light border text-decoration-none"
        >
          <i className="bi bi-battery-charging me-1 text-success"></i>
          {n.availableSlots} / {n.totalSlots} Available
        </Link>
      ),
    },
    {
      header: 'Status',
      render: (n) => <StatusBadge status={n.status} />,
    },
    {
      header: 'Actions',
      render: (n) => (
        <div className="d-flex gap-1">
          <Link
            to={`/backoffice/nodes/${n.id}`}
            className="btn btn-sm btn-outline-primary py-0 px-2"
            title="Inspect Specifications & Schedule"
          >
            <i className="bi bi-eye"></i> View
          </Link>
          <Link
            to={`/backoffice/nodes/${n.id}/edit`}
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            title="Edit Parameters"
          >
            <i className="bi bi-pencil"></i>
          </Link>
          {n.status === 'Active' ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2"
              onClick={() => {
                setNodeToDeactivate(n);
                setDeactivationError(null);
              }}
              title="Decommission / Deactivate Node"
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-success py-0 px-2"
              disabled={isReactivatingId === n.id}
              onClick={() => handleReactivate(n)}
              title="Reactivate Node to Accept Energy Transfers"
            >
              {isReactivatingId === n.id ? 'Activating...' : 'Activate'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Microgrid Node Fleet Management"
        description="Monitor distributed substations, configure peak power thresholds, and oversee battery storage bays."
        actions={
          <Link to="/backoffice/nodes/new" className="btn-primary-custom">
            <i className="bi bi-plus-circle me-1"></i> Commission New Node
          </Link>
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
          placeholder="Search by Node ID, Name, or Address..."
        />
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Operational States</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredNodes}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Microgrid Nodes Found"
        emptyDescription="No substations match your filter criteria."
      />

      {/* Deactivation Dialogue with Explicit API Rule Feedback */}
      {nodeToDeactivate && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setNodeToDeactivate(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deact-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="deact-modal-title" className="h3 mb-0 text-danger">
                Decommission Substation {nodeToDeactivate.id}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setNodeToDeactivate(null)}
              ></button>
            </div>
            <div className="modal-body-custom">
              {deactivationError ? (
                <div className="alert alert-danger d-flex align-items-start gap-2 mb-3 small" role="alert">
                  <i className="bi bi-slash-circle-fill fs-5 mt-1"></i>
                  <div>
                    <strong className="d-block">Deactivation Blocked by Business Rule:</strong>
                    {deactivationError}
                  </div>
                </div>
              ) : (
                <p className="text-muted-custom small mb-3">
                  Are you sure you want to deactivate <strong>{nodeToDeactivate.name}</strong> ({nodeToDeactivate.id})?
                  The API will verify whether active or pending forward energy reservations exist before taking this node offline.
                </p>
              )}

              <div className="alert alert-light border small text-muted-custom">
                <i className="bi bi-shield-exclamation me-1 text-warning"></i>
                <strong>API Boundary Check:</strong> If any reservations are scheduled for this node within the forward 7-day window, the Centralized C# API will reject deactivation with HTTP 409 Conflict.
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setNodeToDeactivate(null)}
                disabled={isDeactivating}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-danger-custom"
                onClick={handleDeactivateConfirm}
                disabled={isDeactivating}
              >
                {isDeactivating ? 'Verifying with API...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
