import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodes } from '../../services/nodeService';
import { getReservations } from '../../services/reservationService';

export default function OperatorDashboardPage() {
  const { showError } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div>
      <PageHeader
        title="Grid Operator Real-Time Console"
        description="Monitor active energy dispatches, substation frequency stability, and modular battery bay states."
        actions={
          <div className="d-flex gap-2">
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
    </div>
  );
}
