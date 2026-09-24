import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodes } from '../../services/nodeService';
import { getBatterySlots, updateBatterySlotStatus } from '../../services/batteryService';

export default function BatterySlotsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(id || '');
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit slot modal
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newStatus, setNewStatus] = useState('Available');
  const [overrideReason, setOverrideReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadSlots = async (nodeId) => {
    setIsLoading(true);
    try {
      const nodeList = await getNodes();
      setNodes(nodeList);

      const activeId = nodeId || id || (nodeList.length > 0 ? nodeList[0].id : '');
      if (activeId) {
        if (!selectedNodeId || selectedNodeId !== activeId) {
          setSelectedNodeId(activeId);
        }
        const slotList = await getBatterySlots(activeId);
        setSlots(slotList);
      } else {
        setSlots([]);
      }
    } catch {
      showError('Failed to load battery bay slots.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedNodeId);

    const handleSlotsUpdated = () => {
      loadSlots(selectedNodeId);
    };
    window.addEventListener('solargrid_slots_updated', handleSlotsUpdated);
    return () => {
      window.removeEventListener('solargrid_slots_updated', handleSlotsUpdated);
    };
  }, [selectedNodeId, id]);

  const handleNodeChange = (newId) => {
    setSelectedNodeId(newId);
    navigate(`/backoffice/nodes/${newId}/battery-slots`);
  };

  const openSlotModal = (slot) => {
    setSelectedSlot(slot);
    setNewStatus(slot.status === 'Available' ? 'Unavailable' : 'Available');
    setOverrideReason(slot.reason || '');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateBatterySlotStatus(
        selectedNodeId,
        selectedSlot.slotNumber,
        newStatus,
        overrideReason
      );
      showSuccess(`Slot #${selectedSlot.slotNumber} updated to ${newStatus}.`);
      setSelectedSlot(null);
      await loadSlots(selectedNodeId);
    } catch (err) {
      showError(err.message || 'Failed to update battery slot state.');
    } finally {
      setIsUpdating(false);
    }
  };

  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const reservedCount = slots.filter((s) => s.status === 'Reserved').length;
  const unavailableCount = slots.filter((s) => s.status === 'Unavailable' || s.status === 'Maintenance').length;

  return (
    <div>
      <PageHeader
        title="Battery-Slot Allocation Management"
        description="Inspect telemetry for individual modular battery bays, monitor thermal indicators, and manage maintenance isolation."
        breadcrumbItems={[
          { label: 'Microgrid Nodes', path: '/backoffice/nodes' },
          { label: selectedNodeId, path: `/backoffice/nodes/${selectedNodeId}` },
          { label: 'Battery Slots' },
        ]}
      />

      {/* Substation Switcher & KPI Counter Bar */}
      <div className="row g-3 mb-4 align-items-center">
        <div className="col-12 col-md-4">
          <div className="content-card mb-0 p-3">
            <label className="fw-semibold small text-muted-custom mb-1" htmlFor="bayNodeSelect">
              SELECT SUBSTATION
            </label>
            <select
              id="bayNodeSelect"
              className="form-select"
              value={selectedNodeId}
              onChange={(e) => handleNodeChange(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="row g-2">
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Available</div>
                <div className="fs-4 fw-bold text-success">{availableCount}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Reserved</div>
                <div className="fs-4 fw-bold text-primary">{reservedCount}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Maintenance</div>
                <div className="fs-4 fw-bold text-danger">{unavailableCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Bays Visual Matrix */}
      {isLoading ? (
        <div className="p-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="content-card p-4 text-center text-muted-custom">
          No battery bay modules commissioned on this substation.
        </div>
      ) : (
        <div className="row g-3">
          {slots.map((slot) => {
            const cardVariantClass =
              slot.status === 'Available'
                ? 'battery-slot-card--available'
                : slot.status === 'Reserved'
                ? 'battery-slot-card--reserved'
                : 'battery-slot-card--unavailable';

            return (
              <div key={slot.slotNumber} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div className={`battery-slot-card ${cardVariantClass}`}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold fs-6">Bay #{String(slot.slotNumber).padStart(2, '0')}</span>
                    <StatusBadge status={slot.status} />
                  </div>

                  <div className="font-monospace text-muted-custom small mb-2">
                    {slot.hardwareId}
                  </div>

                  <div className="small mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted-custom">State of Charge:</span>
                      <span className="fw-semibold">
                        {slot.status === 'Unavailable' || slot.status === 'Maintenance'
                          ? '0% (Offline)'
                          : slot.status === 'Reserved'
                          ? '100% (Reserved)'
                          : `${slot.soc}% (Ready)`}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${
                          slot.status === 'Unavailable' || slot.status === 'Maintenance'
                            ? 'bg-secondary'
                            : slot.status === 'Reserved'
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{ width: `${slot.status === 'Unavailable' || slot.status === 'Maintenance' ? 0 : slot.soc}%` }}
                        aria-valuenow={slot.soc}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between small text-muted-custom mb-2">
                    <span>Operating Temp:</span>
                    <span className="fw-semibold text-dark">
                      {slot.status === 'Unavailable' || slot.status === 'Maintenance' || slot.tempC <= 0
                        ? 'Offline'
                        : `${slot.tempC} °C (Nominal)`}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between small text-muted-custom mb-2">
                    <span>Bay Capacity:</span>
                    <span className="fw-semibold text-dark">
                      {slot.totalCapacity} kWh
                    </span>
                  </div>

                  {slot.reason && (
                    <div className="alert alert-warning py-1 px-2 mb-2 small" style={{ fontSize: '0.72rem' }}>
                      <strong>Note:</strong> {slot.reason}
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted-custom" style={{ fontSize: '0.68rem' }}>
                      {new Date(slot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      onClick={() => openSlotModal(slot)}
                    >
                      Override State
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Override Slot State Modal */}
      {selectedSlot && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setSelectedSlot(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="slot-modal-title" className="h3 mb-0">
                Override Bay #{selectedSlot.slotNumber} Availability
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedSlot(null)}
              ></button>
            </div>
            <form onSubmit={handleStatusUpdate}>
              <div className="modal-body-custom">
                <div className="mb-3">
                  <label className="field-label" htmlFor="newSlotStatus">
                    Operational Bay State <span className="required-star">*</span>
                  </label>
                  <select
                    id="newSlotStatus"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Available">Available (Allow Prosumer Bookings)</option>
                    <option value="Unavailable">Unavailable (Isolate for Maintenance)</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="field-label" htmlFor="reasonInput">
                    Operational Reason / Notes
                  </label>
                  <input
                    type="text"
                    id="reasonInput"
                    className="form-control"
                    placeholder="e.g. Scheduled inverter recalibration"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-secondary-custom"
                  onClick={() => setSelectedSlot(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Apply State Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
