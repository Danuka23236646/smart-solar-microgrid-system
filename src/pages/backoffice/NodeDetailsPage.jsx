import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';
import { getNodeById, deactivateNode } from '../../services/nodeService';
import { getNodeSchedules } from '../../services/scheduleService';
import { getReservations } from '../../services/reservationService';

export default function NodeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [node, setNode] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [nodeData, schedData, resData] = await Promise.all([
        getNodeById(id),
        getNodeSchedules(id),
        getReservations({ nodeId: id }),
      ]);
      setNode(nodeData);
      setSchedules(schedData);
      setReservations(resData);
    } catch {
      showError('Failed to load substation telemetry.');
      navigate('/backoffice/nodes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateNode(id);
      showSuccess(`Node ${node.name} successfully deactivated.`);
      setShowDeactivateModal(false);
      await fetchData();
    } catch (err) {
      setDeactivateError(err.message || 'API blocked node deactivation.');
      showError('Deactivation rejected by central API.');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading || !node) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading node details...</span>
        </div>
      </div>
    );
  }

  const reservationColumns = [
    {
      header: 'Res ID',
      accessor: 'id',
      render: (r) => <span className="font-monospace fw-semibold">{r.id}</span>,
    },
    { header: 'Prosumer NIC', accessor: 'prosumerNic' },
    { header: 'Slot #', accessor: 'slotNumber', render: (r) => `Bay #${r.slotNumber}` },
    {
      header: 'Window',
      render: (r) => (
        <span className="small">
          {new Date(r.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    { header: 'Volume', render: (r) => `${r.energyAmountKwh} kWh` },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={`Substation: ${node.name}`}
        description={`${node.address} | Commissioned: ${node.commissionedDate}`}
        breadcrumbItems={[
          { label: 'Microgrid Nodes', path: '/backoffice/nodes' },
          { label: node.id },
        ]}
        actions={
          <div className="d-flex gap-2">
            <Link to={`/backoffice/nodes/${node.id}/schedule`} className="btn-secondary-custom">
              <i className="bi bi-calendar-week me-1"></i> Manage Schedule
            </Link>
            <Link to={`/backoffice/nodes/${node.id}/battery-slots`} className="btn-secondary-custom">
              <i className="bi bi-battery-charging me-1"></i> Battery Slots
            </Link>
            <Link to={`/backoffice/nodes/${node.id}/edit`} className="btn-primary-custom">
              <i className="bi bi-pencil me-1"></i> Edit Configuration
            </Link>
            {node.status === 'Active' && (
              <button
                type="button"
                className="btn-danger-custom"
                onClick={() => {
                  setDeactivateError(null);
                  setShowDeactivateModal(true);
                }}
              >
                Deactivate Node
              </button>
            )}
          </div>
        }
      />

      {/* 3 Overview Telemetry Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="content-card mb-0 h-100 p-3">
            <div className="text-muted-custom small text-uppercase fw-semibold mb-1">
              Geospatial Location
            </div>
            <div className="fs-5 fw-bold font-monospace mb-1">
              {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
            </div>
            <div className="text-muted-custom small">Physical Zone: Western Grid Sector</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="content-card mb-0 h-100 p-3">
            <div className="text-muted-custom small text-uppercase fw-semibold mb-1">
              Power & Storage Rating
            </div>
            <div className="fs-5 fw-bold text-success mb-1">
              {node.capacityKw} kW Peak / {node.storageCapacityKwh} kWh
            </div>
            <div className="text-muted-custom small">Central Inverter Hub Online</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="content-card mb-0 h-100 p-3">
            <div className="text-muted-custom small text-uppercase fw-semibold mb-1">
              Modular Battery Capacity
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <div className="fs-5 fw-bold text-primary">
                {node.availableSlots} of {node.totalSlots} Slots Free
              </div>
              <StatusBadge status={node.status} />
            </div>
            <div className="text-muted-custom small mt-1">Modular Battery Bays Active</div>
          </div>
        </div>
      </div>

      {/* Schedules Summary */}
      <div className="content-card mb-4">
        <div className="content-card__header">
          <h2 className="content-card__title">Operating Schedule Windows</h2>
          <Link to={`/backoffice/nodes/${node.id}/schedule`} className="btn btn-sm btn-link text-decoration-none p-0">
            Edit Full Week &raquo;
          </Link>
        </div>
        <div className="content-card__body">
          {schedules.length === 0 ? (
            <div className="text-muted-custom small">No custom schedules defined; operating on standard grid schedule.</div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="table table-sm table-borderless mb-0 small">
                <thead>
                  <tr className="text-muted-custom border-bottom">
                    <th>Day of Week</th>
                    <th>Operating Hours</th>
                    <th>Operating Mode</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{s.dayOfWeek}</td>
                      <td>{s.startTime} - {s.endTime}</td>
                      <td>{s.mode}</td>
                      <td><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Forward Reservations for this Node */}
      <div className="content-card">
        <div className="content-card__header">
          <h2 className="content-card__title">Active Forward Reservations on this Node</h2>
          <span className="badge text-bg-light border">{reservations.length} total scheduled</span>
        </div>
        <DataTable
          columns={reservationColumns}
          data={reservations}
          keyField="id"
          emptyTitle="No Reservations Queued"
          emptyDescription="No energy transfers are currently scheduled for this substation."
        />
      </div>

      {/* Deactivate Dialog */}
      {showDeactivateModal && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setShowDeactivateModal(false)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="node-deact-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="node-deact-modal-title" className="h3 mb-0 text-danger">
                Deactivate Node {node.id}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeactivateModal(false)}
              ></button>
            </div>
            <div className="modal-body-custom">
              {deactivateError ? (
                <div className="alert alert-danger small mb-3" role="alert">
                  <i className="bi bi-shield-x me-1"></i>
                  <strong>API Deactivation Constraint Error:</strong>
                  <div className="mt-1">{deactivateError}</div>
                </div>
              ) : (
                <p className="text-muted-custom small mb-3">
                  Are you sure you want to deactivate <strong>{node.name}</strong>? If there are any
                  scheduled or active energy bookings, the C# API will reject this command.
                </p>
              )}
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => setShowDeactivateModal(false)}
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-custom"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? 'Checking with API...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
