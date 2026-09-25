import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodes } from '../../services/nodeService';
import { getBatterySlots, updateBatterySlotStatus } from '../../services/batteryService';

export default function OperatorBatteryPage() {
  const { showSuccess, showError } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Override State Modal
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [targetStatus, setTargetStatus] = useState('Available');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSlots = async (nodeId) => {
    setIsLoading(true);
    try {
      const nodeList = await getNodes();
      setNodes(nodeList);

      const activeId = nodeId || (nodeList.length > 0 ? nodeList[0].id : '');
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
      showError('Failed to synchronize battery storage telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedNodeId);

    const handleSlotsUpdated = () => {
      fetchSlots(selectedNodeId);
    };
    window.addEventListener('solargrid_slots_updated', handleSlotsUpdated);
    return () => {
      window.removeEventListener('solargrid_slots_updated', handleSlotsUpdated);
    };
  }, [selectedNodeId]);

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateBatterySlotStatus(selectedNodeId, selectedSlot.slotNumber, targetStatus, reason);
      showSuccess(`Bay #${selectedSlot.slotNumber} set to ${targetStatus}.`);
      setSelectedSlot(null);
      setReason('');
      await fetchSlots(selectedNodeId);
    } catch (err) {
      showError(err.message || 'API failed to update slot status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const reservedCount = slots.filter((s) => s.status === 'Reserved').length;
  const unavailableCount = slots.filter((s) => s.status === 'Unavailable' || s.status === 'Maintenance').length;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || {};
  const capacityKwh = selectedNode.capacityKw || selectedNode.storageCapacityKwh || 600;
  const currentStoredKwh = typeof selectedNode.currentStoredEnergyKwh === 'number'
    ? selectedNode.currentStoredEnergyKwh
    : Math.min(capacityKwh, Math.max(0, (selectedNode.receivedEnergyKwh || 0) - (selectedNode.dispatchedEnergyKwh || 0)));
  const availableIntakeKwh = typeof selectedNode.availableIntakeKwh === 'number'
    ? selectedNode.availableIntakeKwh
    : Math.max(0, capacityKwh - currentStoredKwh);
  const batteryPct = Math.min(100, Math.round((currentStoredKwh / capacityKwh) * 100));
  const receivedKwh = selectedNode.receivedEnergyKwh || 0;
  const dispatchedKwh = selectedNode.dispatchedEnergyKwh || 0;
  const isOutOfStorage = availableCount === 0 || availableIntakeKwh <= 0 || selectedNode.isOutOfStorage;

  return (
    <div>
      <PageHeader
        title="Battery Storage Slot Availability"
        description="Monitor individual battery module bay health, isolate defective bays, and release slots after maintenance."
      />

      {/* Substation Selection & Quick Metric Bar */}
      <div className="row g-3 mb-3 align-items-center">
        <div className="col-12 col-md-5">
          <div className="content-card mb-0 p-3">
            <label className="fw-semibold small text-muted-custom mb-1" htmlFor="operatorNodeSelect">
              SELECT MONITORED SUBSTATION
            </label>
            <select
              id="operatorNodeSelect"
              className="form-select"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.id}) {n.isOutOfStorage || n.availableSlots === 0 || n.availableIntakeKwh <= 0 ? ' [⛔ OUT OF STORAGE]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-12 col-md-7">
          <div className="row g-2">
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Available Bays</div>
                <div className={`fs-4 fw-bold ${availableCount === 0 || isOutOfStorage ? 'text-danger' : 'text-success'}`}>
                  {isOutOfStorage ? 0 : availableCount}
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Reserved</div>
                <div className="fs-4 fw-bold text-primary">{isOutOfStorage ? slots.length : reservedCount}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-3 bg-white border rounded text-center">
                <div className="text-muted-custom small text-uppercase">Offline / Maint</div>
                <div className="fs-4 fw-bold text-danger">{unavailableCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Substation Physical Battery Storage & Headroom Telemetry */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className={`content-card mb-0 p-3 border-start border-4 ${batteryPct >= 100 ? 'border-danger' : 'border-success'}`}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="text-muted-custom small text-uppercase fw-semibold">Current Battery Storage Level</div>
                <div className={`fs-4 fw-bold mt-1 ${batteryPct >= 100 ? 'text-danger' : 'text-success'}`}>
                  {currentStoredKwh} <span className="fs-6 fw-normal text-muted">/ {capacityKwh} kWh</span>
                </div>
                <div className="small text-muted">{batteryPct}% Physical State of Charge</div>
              </div>
              <span className={`badge ${batteryPct >= 100 ? 'bg-danger text-white' : 'bg-success-subtle text-success'} p-2`}>
                <i className="bi bi-battery-full fs-5"></i>
              </span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div
                className={`progress-bar ${batteryPct >= 100 ? 'bg-danger' : batteryPct > 80 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${batteryPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="content-card mb-0 p-3 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted-custom small text-uppercase fw-semibold">Cumulative Energy Flow</div>
                <div className="fs-5 fw-bold text-dark mt-1">
                  <span className="text-success">+{receivedKwh}</span> / <span className="text-primary">-{dispatchedKwh}</span> <span className="fs-6 fw-normal text-muted">kWh</span>
                </div>
                <div className="small text-muted mt-1">Received (Drop-Off) / Dispatched (EV)</div>
              </div>
              <span className="badge bg-primary-subtle text-primary p-2">
                <i className="bi bi-arrow-left-right fs-5"></i>
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className={`content-card mb-0 p-3 border-start border-4 ${isOutOfStorage ? 'border-danger bg-danger-subtle bg-opacity-10' : 'border-info'}`}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted-custom small text-uppercase fw-semibold">Storage Intake Headroom</div>
                <div className={`fs-4 fw-bold mt-1 ${isOutOfStorage ? 'text-danger' : 'text-success'}`}>
                  {availableIntakeKwh} <span className="fs-6 fw-normal text-muted">kWh</span>
                </div>
                <div className={`small fw-semibold ${isOutOfStorage ? 'text-danger' : 'text-success'}`}>
                  {isOutOfStorage ? '⛔ OUT OF STORAGE (BATTERY FULL)' : `✅ ${availableCount} bay(s) ready to receive`}
                </div>
              </div>
              <span className={`badge ${isOutOfStorage ? 'bg-danger text-white' : 'bg-success-subtle text-success'} p-2`}>
                <i className={`bi ${isOutOfStorage ? 'bi-shield-fill-x' : 'bi-battery-charging'} fs-5`}></i>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Out-of-Storage Alert Banner */}
      {isOutOfStorage && (
        <div className="alert alert-danger border-2 d-flex align-items-center mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-2 text-danger me-3"></i>
          <div>
            <div className="fw-bold fs-6 text-danger">⚠️ SUBSTATION OUT OF STORAGE CAPACITY (BATTERY FULL)</div>
            <div className="small text-danger-emphasis">
              Substation <strong>{selectedNode.name || selectedNodeId}</strong> is at <strong>{currentStoredKwh} / {capacityKwh} kWh ({batteryPct}% full)</strong>.
              Remaining intake headroom is <strong>{availableIntakeKwh} kWh</strong>.
              Mobile prosumers cannot book <strong>Energy Drop-Off (SELL)</strong> reservations until battery energy is dispatched.
            </div>
          </div>
        </div>
      )}

      {/* Slot Module Cards */}
      {isLoading ? (
        <div className="p-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="content-card p-4 text-center text-muted-custom">
          No battery bay modules found for the selected substation.
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
                      <strong>Reason:</strong> {slot.reason}
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted-custom" style={{ fontSize: '0.68rem' }}>
                      {new Date(slot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setTargetStatus(slot.status === 'Available' ? 'Unavailable' : 'Available');
                        setReason(slot.reason || '');
                      }}
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

      {/* Override Dialog */}
      {selectedSlot && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setSelectedSlot(null)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="op-slot-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="op-slot-title" className="h3 mb-0">
                Operational Bay Override: Bay #{selectedSlot.slotNumber}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedSlot(null)}
              ></button>
            </div>
            <form onSubmit={handleApplyOverride}>
              <div className="modal-body-custom">
                <div className="mb-3">
                  <label className="field-label" htmlFor="opTargetStatus">
                    Set Operational Status <span className="required-star">*</span>
                  </label>
                  <select
                    id="opTargetStatus"
                    className="form-select"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                  >
                    <option value="Available">Available (Online for Energy Transfers)</option>
                    <option value="Unavailable">Unavailable (Physical Isolation / Defect)</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="field-label" htmlFor="opReason">
                    Operational Note / Reason
                  </label>
                  <input
                    type="text"
                    id="opReason"
                    className="form-control"
                    placeholder="e.g. Overheated cell sensor inspection"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
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
                  {isUpdating ? 'Applying Override...' : 'Apply Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
