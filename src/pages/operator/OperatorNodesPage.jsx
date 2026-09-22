import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodes } from '../../services/nodeService';

export default function OperatorNodesPage() {
  const { showError } = useNotification();
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchNodes = async () => {
    setIsLoading(true);
    try {
      const data = await getNodes();
      setNodes(data);
    } catch {
      showError('Failed to fetch substation fleet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const filteredNodes = nodes.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.id.toLowerCase().includes(search.toLowerCase()) ||
      n.address.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Substation ID',
      accessor: 'id',
      render: (n) => <span className="font-monospace fw-semibold">{n.id}</span>,
    },
    {
      header: 'Facility Name & Location',
      render: (n) => (
        <div>
          <div className="fw-semibold">{n.name}</div>
          <div className="text-muted-custom small text-truncate" style={{ maxWidth: '300px' }}>
            {n.address}
          </div>
        </div>
      ),
    },
    {
      header: 'Capacity Ratings',
      render: (n) => (
        <div>
          <span className="fw-semibold">{n.capacityKw} kW</span>
          <div className="text-muted-custom small">{n.storageCapacityKwh} kWh storage</div>
        </div>
      ),
    },
    {
      header: 'Battery Bays Free',
      render: (n) => (
        <span className="badge text-bg-light border">
          {n.availableSlots} / {n.totalSlots} Slots Free
        </span>
      ),
    },
    {
      header: 'Operational Status',
      render: (n) => <StatusBadge status={n.status} />,
    },
    {
      header: 'Operator Actions',
      render: (n) => (
        <div className="d-flex gap-1">
          <Link
            to="/operator/battery-availability"
            className="btn btn-sm btn-outline-success py-0 px-2"
            title="Inspect & Override Battery Bays"
          >
            <i className="bi bi-battery-charging me-1"></i> Battery Slots
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grid Substation Fleet Telemetry"
        description="Live operational telemetry, bay availability, and transformer load monitoring for all operational zones."
      />

      <FilterBar hasActiveFilters={search !== ''} onReset={() => setSearch('')}>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Filter by Substation Code or Facility Name..."
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredNodes}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Nodes Found"
        emptyDescription="No microgrid nodes match your criteria."
      />
    </div>
  );
}
