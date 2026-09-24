import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import SearchField from '../../components/common/SearchField';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Pagination from '../../components/common/Pagination';
import { useNotification } from '../../context/NotificationContext';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../../services/userService';

export default function WebUsersPage() {
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalForm, setModalForm] = useState({ name: '', email: '', role: 'GridOperator', status: 'Active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivation Dialog
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      showError('Failed to fetch web user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      let matchesRole = true;
      if (roleFilter === 'StaffOnly') {
        matchesRole = user.role === 'BackofficeOfficer' || user.role === 'GridOperator' || user.role === 'Backoffice';
      } else if (roleFilter !== 'All') {
        matchesRole = user.role === roleFilter;
      }

      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const pageSize = 5;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAddModal = () => {
    setEditingUser(null);
    setModalForm({ name: '', email: '', role: 'GridOperator', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setModalForm({
      name: user.name,
      email: user.email,
      role: user.role === 'BackofficeOfficer' || user.role === 'Backoffice'
        ? 'BackofficeOfficer'
        : (user.role === 'Prosumer' ? 'Prosumer' : 'GridOperator'),
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, modalForm);
        showSuccess(`User ${modalForm.name} updated successfully.`);
      } else {
        await createUser(modalForm);
        showSuccess(`Web user ${modalForm.name} created successfully.`);
      }
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      showError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      const updated = await toggleUserStatus(deactivateTarget.id);
      showSuccess(`User status changed to ${updated.status}.`);
      setDeactivateTarget(null);
      await fetchUsers();
    } catch (err) {
      showError(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: 'name',
      render: (u) => (
        <div>
          <span className="fw-semibold">{u.name}</span>
          <div className="font-monospace text-muted-custom" style={{ fontSize: '0.72rem' }}>
            {u.id}
          </div>
        </div>
      ),
    },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'System Role',
      render: (u) => {
        if (u.role === 'BackofficeOfficer' || u.role === 'Backoffice') {
          return (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              Backoffice Officer
            </span>
          );
        }
        if (u.role === 'GridOperator') {
          return (
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              Grid Operator
            </span>
          );
        }
        if (u.role === 'Prosumer') {
          return (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
              Prosumer
            </span>
          );
        }
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
            {u.role || 'User'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      header: 'Created Date',
      render: (u) => (
        <span className="text-muted-custom small">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (u) => (
        <div className="d-flex gap-2 align-items-center">
          {u.role === 'Prosumer' ? (
            <a
              href="/backoffice/prosumers"
              className="btn btn-sm btn-outline-primary py-0 px-2 text-decoration-none"
              title="Open Prosumer Ledger"
            >
              <i className="bi bi-person-lines-fill me-1"></i> View in Prosumers
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              onClick={() => openEditModal(u)}
              title="Edit User"
            >
              <i className="bi bi-pencil me-1"></i> Edit
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 ${
              u.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'
            }`}
            onClick={() => setDeactivateTarget(u)}
            title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
          >
            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Web User Management"
        description="Provision and govern accounts for Backoffice Officers and Grid Operators."
        actions={
          <button type="button" onClick={openAddModal} className="btn-primary-custom">
            <i className="bi bi-person-plus-fill me-1"></i> Add Web User
          </button>
        }
      />

      <FilterBar
        hasActiveFilters={search !== '' || roleFilter !== 'All' || statusFilter !== 'All'}
        onReset={() => {
          setSearch('');
          setRoleFilter('All');
          setStatusFilter('All');
        }}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="StaffOnly">Staff Only (Officers & Operators)</option>
          <option value="BackofficeOfficer">Backoffice Officer</option>
          <option value="GridOperator">Grid Operator</option>
          <option value="Prosumer">Prosumer</option>
        </select>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={paginatedUsers}
        keyField="id"
        isLoading={isLoading}
        emptyTitle="No Web Users Found"
        emptyDescription="No users match your selected search query or filters."
      />

      <Pagination
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop-custom" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h3 id="user-modal-title" className="h3 mb-0">
                {editingUser ? 'Edit Web User' : 'Create New Web User'}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              ></button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="modal-body-custom">
                <div className="mb-3">
                  <label className="field-label" htmlFor="userName">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="userName"
                    className="form-control"
                    placeholder="e.g. Kasun Silva"
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="field-label" htmlFor="userEmail">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    className="form-control"
                    placeholder="e.g. staff@sungrid.com"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="field-label">
                    Assigned Role <span className="required-star">*</span>
                  </label>
                  {editingUser && editingUser.role === 'Prosumer' ? (
                    <div className="p-2 rounded bg-light border">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle py-1 px-2">
                          <i className="bi bi-person-badge me-1"></i> Prosumer
                        </span>
                        <span className="small text-muted-custom">Clean Energy Producer / Consumer</span>
                      </div>
                      <div className="small text-muted-custom" style={{ fontSize: '0.75rem' }}>
                        To modify solar capacity, address, or prosumer lifecycle status, visit the{' '}
                        <a href="/backoffice/prosumers" className="text-primary text-decoration-none fw-semibold">
                          Prosumer Directory
                        </a>.
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex gap-3 mt-1">
                      <div className="form-check">
                        <input
                          type="radio"
                          id="roleBackoffice"
                          name="userRole"
                          className="form-check-input"
                          value="BackofficeOfficer"
                          checked={modalForm.role === 'BackofficeOfficer'}
                          onChange={(e) => setModalForm({ ...modalForm, role: e.target.value })}
                        />
                        <label htmlFor="roleBackoffice" className="form-check-label small">
                          Backoffice Officer
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          id="roleOperator"
                          name="userRole"
                          className="form-check-input"
                          value="GridOperator"
                          checked={modalForm.role === 'GridOperator'}
                          onChange={(e) => setModalForm({ ...modalForm, role: e.target.value })}
                        />
                        <label htmlFor="roleOperator" className="form-check-label small">
                          Grid Operator
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {!editingUser && (
                  <div className="alert alert-light border small text-muted-custom mb-0">
                    <i className="bi bi-info-circle me-1"></i> Temporary default password will be assigned as{' '}
                    <code>Solar@123</code>. The user can update it on their profile page.
                  </div>
                )}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Save Updates' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={!!deactivateTarget}
        title={deactivateTarget?.status === 'Active' ? 'Deactivate Web User' : 'Activate Web User'}
        message={
          deactivateTarget?.status === 'Active'
            ? `Are you sure you want to deactivate ${deactivateTarget?.name}? They will immediately lose access to the portal.`
            : `Are you sure you want to reactivate ${deactivateTarget?.name}?`
        }
        confirmLabel={deactivateTarget?.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
        confirmVariant={deactivateTarget?.status === 'Active' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
