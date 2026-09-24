import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodes } from '../../services/nodeService';
import { getReservations } from '../../services/reservationService';
import { verifyQr, completeEnergyTransfer } from '../../services/qrService';

export default function OperatorDashboardPage() {
  const { showSuccess, showError } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState('');
  const [qrVerifyResult, setQrVerifyResult] = useState(null);
  const [actualEnergyKwh, setActualEnergyKwh] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCompleteLoading, setQrCompleteLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [nodeList, resList] = await Promise.all([
        getNodes(),
        getReservations(),
      ]);
      setNodes(nodeList);
      setReservations(resList);
    } catch {
      showError('Failed to synchronize grid telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleSlotsUpdated = () => {
      fetchData();
    };
    window.addEventListener('solargrid_slots_updated', handleSlotsUpdated);
    return () => {
      window.removeEventListener('solargrid_slots_updated', handleSlotsUpdated);
    };
  }, []);

  const pendingCount = reservations.filter((r) => r.status === 'Pending').length;
  const approvedCount = reservations.filter((r) => r.status === 'Approved').length;
  const completedTransfers = reservations.filter((r) => r.status === 'Completed');
  const todayTransfers = reservations.filter(
    (r) => r.status === 'Approved' || r.status === 'Pending'
  ).slice(0, 5);

  const totalSlots = nodes.reduce((sum, n) => sum + n.totalSlots, 0);
  const availableSlots = nodes.reduce((sum, n) => sum + n.availableSlots, 0);

  const todayColumns = [
    {
      header: 'Reservation ID',
      accessor: 'id',
      render: (r) => <span className="font-monospace fw-semibold">{r.id}</span>,
    },
    {
      header: 'Substation & Bay',
      render: (r) => `${r.nodeName} (Bay #${r.slotNumber})`,
    },
    {
      header: 'Direction',
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
      header: 'Execution Time',
      render: (r) => (
        <span className="small">
          {new Date(r.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Volume',
      render: (r) => <span className="fw-semibold">{r.energyAmountKwh} kWh</span>,
    },
    {
      header: 'State',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const handleVerifyQr = async (e) => {
    e.preventDefault();
    if (!qrPayload.trim()) return;
    setQrLoading(true);
    setQrVerifyResult(null);
    try {
      const res = await verifyQr(qrPayload);
      setQrVerifyResult(res);
      setActualEnergyKwh(String(res.expectedEnergyAmountKwh || ''));
      if (!res.isValid) {
        showError(res.message || 'QR code validation failed.');
      }
    } catch (err) {
      showError(err.message || 'QR verification request failed.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCompleteTransfer = async (e) => {
    e.preventDefault();
    if (!qrPayload.trim() || !actualEnergyKwh) return;
    setQrCompleteLoading(true);
    try {
      const res = await completeEnergyTransfer(qrPayload, actualEnergyKwh, completionNotes);
      showSuccess(res.message || 'Energy transfer completed successfully.');
      setIsQrModalOpen(false);
      setQrPayload('');
      setQrVerifyResult(null);
      setActualEnergyKwh('');
      setCompletionNotes('');
      await fetchData();
    } catch (err) {
      showError(err.message || 'Failed to complete energy transfer.');
    } finally {
      setQrCompleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Grid Operator Real-Time Console"
        description="Monitor active energy dispatches, substation frequency stability, and modular battery bay states."
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="btn btn-warning d-flex align-items-center gap-1 shadow-sm"
            >
              <i className="bi bi-qr-code-scan"></i> QR Verification & Complete
            </button>
            <button type="button" onClick={fetchData} className="btn-secondary-custom">
              <i className="bi bi-arrow-repeat me-1"></i> Refresh Telemetry
            </button>
            <Link to="/operator/battery-availability" className="btn-success-custom">
              <i className="bi bi-battery-charging me-1"></i> Battery Availability
            </Link>
          </div>
        }
      />

      {/* 4 Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Pending Validations"
            value={pendingCount}
            meta="Transfers awaiting operator approval"
            icon="bi-hourglass-split"
            variant="amber"
            badge={pendingCount > 0 ? <span className="badge bg-warning text-dark">Urgent</span> : null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Today's Active Transfers"
            value={todayTransfers.length}
            meta="Queued for execution today"
            icon="bi-lightning-charge-fill"
            variant="navy"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Approved Forward Bookings"
            value={approvedCount}
            meta="Scheduled across forward 7 days"
            icon="bi-calendar2-check-fill"
            variant="blue"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Free Battery Slots"
            value={`${availableSlots} / ${totalSlots}`}
            meta="Real-time storage availability"
            icon="bi-battery-half"
            variant="green"
          />
        </div>
      </div>

      {/* Main Grid: Today's Queue & Substation Telemetry */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="content-card mb-0 h-100">
            <div className="content-card__header">
              <div className="d-flex align-items-center gap-2">
                <h2 className="content-card__title">Real-Time Dispatch Queue</h2>
                <span className="badge bg-primary-subtle text-primary">Live Today</span>
              </div>
              <Link to="/operator/reservations" className="btn btn-sm btn-link text-decoration-none p-0">
                View All &raquo;
              </Link>
            </div>
            <DataTable
              columns={todayColumns}
              data={todayTransfers}
              keyField="id"
              isLoading={isLoading}
              emptyTitle="No Transfers Queued Today"
              emptyDescription="No prosumer energy transfers are scheduled for the current cycle."
            />
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="content-card mb-0 h-100">
            <div className="content-card__header">
              <h2 className="content-card__title">Substation Fleet Telemetry</h2>
              <Link to="/operator/nodes" className="btn btn-sm btn-link text-decoration-none p-0">
                Inspect Nodes &raquo;
              </Link>
            </div>
            <div className="content-card__body">
              <div className="list-group list-group-flush">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="list-group-item d-flex align-items-center justify-content-between px-0 py-2"
                  >
                    <div>
                      <div className="fw-semibold small">{node.name}</div>
                      <div className="text-muted-custom small" style={{ fontSize: '0.72rem' }}>
                        Load: {Math.round((1 - node.availableSlots / node.totalSlots) * 100)}% &bull;{' '}
                        {node.availableSlots} of {node.totalSlots} Bays Free
                      </div>
                    </div>
                    <div className="text-end">
                      <StatusBadge status={node.status} />
                      <div className="text-muted-custom small mt-1 font-monospace" style={{ fontSize: '0.7rem' }}>
                        {node.capacityKw} kW
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Transfers Ledger */}
      <div className="content-card">
        <div className="content-card__header">
          <h2 className="content-card__title">Recent Dispatched & Completed Energy Transfers</h2>
          <span className="badge bg-success-subtle text-success">{completedTransfers.length} verified</span>
        </div>
        <div className="content-card__body p-0">
          {completedTransfers.length === 0 ? (
            <div className="p-4 text-center text-muted-custom small">
              No historical transfers logged in the current window.
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Substation</th>
                    <th>Transfer Type</th>
                    <th>Volume</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTransfers.map((t) => (
                    <tr key={t.id}>
                      <td className="font-monospace fw-semibold">{t.id}</td>
                      <td>{t.nodeName}</td>
                      <td>{t.transferType}</td>
                      <td className="fw-semibold">{t.energyAmountKwh} kWh</td>
                      <td className="small text-muted-custom">{new Date(t.updatedAt).toLocaleString()}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Phase 4 QR Verification & Completion Modal */}
      {isQrModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title d-flex align-items-center gap-2 fs-6">
                  <i className="bi bi-qr-code-scan text-warning"></i>
                  <span>Secure QR Transaction Verification & Transfer Completion</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setIsQrModalOpen(false);
                    setQrVerifyResult(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                {/* Step 1: Payload Input */}
                <form onSubmit={handleVerifyQr} className="mb-4">
                  <label htmlFor="qrInput" className="form-label fw-semibold small text-muted-custom">
                    SCAN OR PASTE QR PAYLOAD TOKEN (FORMAT: SUNGRID:&lt;TOKEN&gt;)
                  </label>
                  <div className="input-group">
                    <input
                      id="qrInput"
                      type="text"
                      className="form-control font-monospace"
                      placeholder="SUNGRID:4a8b7c9d..."
                      value={qrPayload}
                      onChange={(e) => setQrPayload(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary-custom px-3"
                      disabled={qrLoading || !qrPayload.trim()}
                    >
                      {qrLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-check me-1"></i> Verify QR
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Step 2: Verification Details */}
                {qrVerifyResult && (
                  <div className={`rounded p-3 border mb-3 ${qrVerifyResult.isValid ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className={`fw-bold small ${qrVerifyResult.isValid ? 'text-success' : 'text-danger'}`}>
                        <i className={`bi ${qrVerifyResult.isValid ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                        {qrVerifyResult.isValid ? 'VALID QR PAYLOAD DETECTED' : 'INVALID / UNMATCHED QR TOKEN'}
                      </span>
                      {qrVerifyResult.canComplete && (
                        <span className="badge bg-success">Transfer Window Active</span>
                      )}
                    </div>

                    {qrVerifyResult.isValid ? (
                      <div className="row g-2 small text-dark mt-1">
                        <div className="col-sm-6">
                          <span className="text-muted">Reservation Ref:</span>{' '}
                          <strong className="font-monospace">{qrVerifyResult.reservationReference}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Prosumer:</span>{' '}
                          <strong>{qrVerifyResult.prosumerName}</strong> ({qrVerifyResult.prosumerNic || 'NIC Verified'})
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Substation:</span>{' '}
                          <strong>{qrVerifyResult.stationName}</strong> ({qrVerifyResult.stationCode})
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Transfer Type:</span>{' '}
                          <span className="badge bg-info-subtle text-info-emphasis">{qrVerifyResult.transferType}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Expected Volume:</span>{' '}
                          <strong>{qrVerifyResult.expectedEnergyAmountKwh} kWh</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Status:</span>{' '}
                          <span className="badge bg-primary-subtle text-primary">{qrVerifyResult.reservationStatus}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-danger small">{qrVerifyResult.message}</div>
                    )}
                  </div>
                )}

                {/* Step 3: Completion Form */}
                {qrVerifyResult?.isValid && (
                  <form onSubmit={handleCompleteTransfer} className="border-top pt-3">
                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <label className="form-label fw-semibold small">Actual Metered Energy (kWh) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control"
                          value={actualEnergyKwh}
                          onChange={(e) => setActualEnergyKwh(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label fw-semibold small">Completion Audit Notes (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Meter check OK / Bay validated"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsQrModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success d-flex align-items-center gap-1"
                        disabled={qrCompleteLoading || !actualEnergyKwh}
                      >
                        {qrCompleteLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Finalizing Transfer...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-all"></i> Finalize & Complete Transfer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
