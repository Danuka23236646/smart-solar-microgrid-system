import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { getNodeById, getNodes } from '../../services/nodeService';
import { getNodeSchedules, updateNodeSchedule } from '../../services/scheduleService';

export default function NodeSchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(id || 'ND-NO-01');
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New schedule modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '18:00',
    mode: 'Active Injection & Draw',
    status: 'Available',
  });

  const loadData = async (nodeId) => {
    setIsLoading(true);
    try {
      const [allNodes, schedList] = await Promise.all([
        getNodes(),
        getNodeSchedules(nodeId),
      ]);
      setNodes(allNodes);
      setSchedules(schedList);
    } catch {
      showError('Failed to fetch node schedule windows.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedNodeId);
  }, [selectedNodeId]);

  const handleNodeChange = (newId) => {
    setSelectedNodeId(newId);
    navigate(`/backoffice/nodes/${newId}/schedule`);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = [...schedules, newEntry];
      await updateNodeSchedule(selectedNodeId, updated);
      showSuccess(`Operational window for ${newEntry.dayOfWeek} added.`);
      setIsModalOpen(false);
      await loadData(selectedNodeId);
    } catch (err) {
      showError(err.message || 'API rejected schedule window.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (index) => {
    const updated = schedules.filter((_, i) => i !== index);
    try {
      await updateNodeSchedule(selectedNodeId, updated);
      showSuccess('Schedule entry removed.');
      setSchedules(updated);
    } catch (err) {
      showError(err.message || 'Failed to update schedule.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Node Operational Schedules"
        description="Establish operational time blocks and microgrid mode configurations for energy ingestion and discharge."
        breadcrumbItems={[
          { label: 'Microgrid Nodes', path: '/backoffice/nodes' },
          { label: selectedNodeId, path: `/backoffice/nodes/${selectedNodeId}` },
          { label: 'Operational Schedule' },
        ]}
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary-custom">
            <i className="bi bi-plus-circle me-1"></i> Add Schedule Window
          </button>
        }
      />

      {/* Node Selector Bar */}
      <div className="content-card mb-4">
        <div className="content-card__body d-flex align-items-center gap-3 flex-wrap">
          <label className="fw-semibold small" htmlFor="nodeSelector">
            Active Substation:
          </label>
          <select
            id="nodeSelector"
            className="form-select form-select-sm"
            style={{ width: 'auto', minWidth: '240px' }}
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

      {/* Schedule Table */}
      <div className="content-card">
        <div className="content-card__header">
          <h2 className="content-card__title">Configured Operating Windows</h2>
          <span className="badge text-bg-light border">{schedules.length} windows active</span>
        </div>
        <div className="content-card__body p-0">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="spinner-border spinner-border-sm text-primary"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-4 text-center text-muted-custom small">
              No specific schedule entries set. Node operates on 24/7 standard microgrid baseline.
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day of Week</th>
                    <th>Operating Window</th>
                    <th>Substation Trading Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{s.dayOfWeek}</td>
                      <td>
                        <span className="font-monospace">
                          {s.startTime} &ndash; {s.endTime}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary-emphasis">
                          {s.mode}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2"
                          onClick={() => handleDeleteSchedule(idx)}
                          title="Remove Window"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sched-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="sched-modal-title" className="h3 mb-0">
                Add Operating Schedule Window
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              ></button>
            </div>
            <form onSubmit={handleAddSchedule}>
              <div className="modal-body-custom">
                <div className="mb-3">
                  <label className="field-label" htmlFor="dayOfWeek">
                    Day of the Week <span className="required-star">*</span>
                  </label>
                  <select
                    id="dayOfWeek"
                    className="form-select"
                    value={newEntry.dayOfWeek}
                    onChange={(e) => setNewEntry({ ...newEntry, dayOfWeek: e.target.value })}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="field-label" htmlFor="startTime">
                      Start Time <span className="required-star">*</span>
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      className="form-control"
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="field-label" htmlFor="endTime">
                      End Time <span className="required-star">*</span>
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      className="form-control"
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="field-label" htmlFor="schedMode">
                    Substation Operating Mode <span className="required-star">*</span>
                  </label>
                  <select
                    id="schedMode"
                    className="form-select"
                    value={newEntry.mode}
                    onChange={(e) => setNewEntry({ ...newEntry, mode: e.target.value })}
                  >
                    <option value="Active Injection & Draw">Active Injection &amp; Draw</option>
                    <option value="Solar Injection Only">Solar Injection Only</option>
                    <option value="Grid Draw Only">Grid Draw Only</option>
                    <option value="Peak Shaving Priority">Peak Shaving Priority</option>
                    <option value="Maintenance / Offline">Maintenance / Offline</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="field-label" htmlFor="schedStatus">
                    Availability Flag <span className="required-star">*</span>
                  </label>
                  <select
                    id="schedStatus"
                    className="form-select"
                    value={newEntry.status}
                    onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                  >
                    <option value="Available">Available (Permit prosumer bookings)</option>
                    <option value="Unavailable">Unavailable (Block reservations during window)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-secondary-custom"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Schedule Window'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
