import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';
import { getProsumers, approveProsumer, rejectProsumer } from '../../services/prosumerService';
import { getNodes } from '../../services/nodeService';
import { getReservations } from '../../services/reservationService';

export default function BackofficeDashboardPage() {
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'reject', prosumer }
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, nData, rData] = await Promise.all([
        getProsumers(),
        getNodes(),
        getReservations(),
      ]);
      setProsumers(pData);
      setNodes(nData);
      setReservations(rData);
    } catch {
      showError('Could not load dashboard data from API Gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSlotsUpdated = () => {
      loadData();
    };
    window.addEventListener('solargrid_slots_updated', handleSlotsUpdated);
    return () => {
      window.removeEventListener('solargrid_slots_updated', handleSlotsUpdated);
    };
  }, []);

  const activeProsumersCount = prosumers.filter((p) => p.status === 'Active').length;
  const activeNodesCount = nodes.filter((n) => n.status === 'Active').length;
  const pendingActivations = prosumers.filter((p) => p.status === 'Pending');
  const upcomingReservations = reservations.slice(0, 5);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'approve') {
        await approveProsumer(confirmAction.prosumer.nic);
        showSuccess(`Prosumer ${confirmAction.prosumer.name} approved.`);
      } else {
        await rejectProsumer(confirmAction.prosumer.nic, 'Rejected from quick dashboard queue');
        showSuccess(`Prosumer ${confirmAction.prosumer.name} registration rejected.`);
      }
      setConfirmAction(null);
      await loadData();
    } catch (err) {
      showError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingColumns = [
    {
      header: 'NIC',
      accessor: 'nic',
      render: (p) => <span className="font-monospace fw-semibold">{p.nic}</span>,
    },
    { header: 'Applicant Name', accessor: 'name' },
    { header: 'Submitted', accessor: 'registeredDate' },
    {
      header: 'Actions',
      render: (p) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-success py-0 px-2"
            onClick={() => setConfirmAction({ type: 'approve', prosumer: p })}
            title="Approve Registration"
          >
            <i className="bi bi-check-lg"></i> Approve
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger py-0 px-2"
            onClick={() => setConfirmAction({ type: 'reject', prosumer: p })}
            title="Reject Registration"
          >
            <i className="bi bi-x-lg"></i> Reject
          </button>
        </div>
      ),
    },
  ];

  const reservationColumns = [
    {
      header: 'Res ID',
      accessor: 'id',
      render: (r) => (
        <Link to={`/backoffice/reservations/${r.id}`} className="font-monospace fw-semibold text-decoration-none">
          {r.id}
        </Link>
      ),
    },
    { header: 'Prosumer', accessor: 'prosumerName' },
    { header: 'Node Substation', accessor: 'nodeName' },
    {
      header: 'Execution Window',
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
  ];

  return (
    <div>
      <PageHeader
        title="Backoffice Operations Dashboard"
        description="Real-time system health, pending account approvals, and 7-day reservation overview."
        actions={
          <div className="d-flex gap-2">
            <Link to="/backoffice/prosumers" className="btn-secondary-custom">
              <i className="bi bi-person-plus me-1"></i> Register Prosumer
            </Link>
            <Link to="/backoffice/nodes/new" className="btn-primary-custom">
              <i className="bi bi-plus-circle me-1"></i> Commission Node
            </Link>
          </div>
        }
      />

      {/* 4 Compact Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Active Prosumers"
            value={activeProsumersCount}
            meta={`${prosumers.length} total registered prosumers`}
            icon="bi-people-fill"
            variant="navy"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Active Grid Nodes"
            value={`${activeNodesCount} / ${nodes.length}`}
            meta="100% telemetry online"
            icon="bi-hdd-network-fill"
            variant="green"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="Pending Activations"
            value={pendingActivations.length}
            meta="Awaiting document verification"
            icon="bi-clock-history"
            variant="amber"
            badge={
              pendingActivations.length > 0 ? (
                <span className="badge bg-warning text-dark">Action Required</span>
              ) : null
            }
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <SummaryCard
            title="7-Day Reservations"
            value={reservations.length}
            meta="Active forward energy transfers"
            icon="bi-calendar-check-fill"
            variant="blue"
          />
        </div>
      </div>

      {/* Main Grid: Pending Approvals (8-col) + Fleet Health (4-col) */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="content-card mb-0 h-100">
            <div className="content-card__header">
              <div className="d-flex align-items-center gap-2">
                <h2 className="content-card__title">Pending Prosumer Applications</h2>
                <span className="badge bg-warning-subtle text-warning-emphasis">
                  {pendingActivations.length} queued
                </span>
              </div>
              <Link to="/backoffice/prosumers/pending" className="btn btn-sm btn-link text-decoration-none p-0">
                View All Queue &raquo;
              </Link>
            </div>
            <DataTable
              columns={pendingColumns}
              data={pendingActivations.slice(0, 4)}
              keyField="nic"
              isLoading={isLoading}
              emptyTitle="Activation Queue Clear"
              emptyDescription="There are no prosumer accounts awaiting verification."
            />
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="content-card mb-0 h-100">
            <div className="content-card__header">
              <h2 className="content-card__title">Substation Fleet Health</h2>
              <Link to="/backoffice/nodes" className="btn btn-sm btn-link text-decoration-none p-0">
                Manage Fleet &raquo;
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
                      <div className="text-muted-custom small" style={{ fontSize: '0.75rem' }}>
                        {node.id} &bull; {node.capacityKw} kW &bull; {node.availableSlots}/{node.totalSlots} Slots Free
                      </div>
                    </div>
                    <StatusBadge status={node.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Reservations Table */}
      <div className="content-card">
        <div className="content-card__header">
          <h2 className="content-card__title">Forward Energy Reservations (Next 7 Days)</h2>
          <Link to="/backoffice/reservations" className="btn btn-sm btn-link text-decoration-none p-0">
            Open Reservation Ledger &raquo;
          </Link>
        </div>
        <DataTable
          columns={reservationColumns}
          data={upcomingReservations}
          keyField="id"
          isLoading={isLoading}
          emptyTitle="No Upcoming Reservations"
          emptyDescription="No energy transfers are currently scheduled."
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!confirmAction}
        title={confirmAction?.type === 'approve' ? 'Authorize Prosumer Account' : 'Reject Prosumer Application'}
        message={
          confirmAction?.type === 'approve'
            ? `Are you sure you want to approve registration for ${confirmAction?.prosumer.name} (${confirmAction?.prosumer.nic})? This will immediately grant microgrid trading privileges.`
            : `Are you sure you want to reject registration for ${confirmAction?.prosumer.name} (${confirmAction?.prosumer.nic})?`
        }
        confirmLabel={confirmAction?.type === 'approve' ? 'Authorize Account' : 'Reject Application'}
        confirmVariant={confirmAction?.type === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
