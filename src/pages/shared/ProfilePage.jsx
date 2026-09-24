import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/common/FormSection';
import FormActions from '../../components/common/FormActions';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { updateUserPassword } from '../../services/authService';

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserPassword(user.id, currentPassword, newPassword);
      showSuccess('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
      showError(err.message || 'Password update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Profile & Security"
        description="Inspect account privileges and manage your system credentials."
        breadcrumbItems={[
          { label: 'Portal', path: role === 'BackofficeOfficer' ? '/backoffice/dashboard' : '/operator/dashboard' },
          { label: 'User Profile' },
        ]}
      />

      <div className="row g-4">
        {/* Left: User Details Card */}
        <div className="col-12 col-lg-5">
          <div className="content-card">
            <div className="content-card__header">
              <h2 className="content-card__title">Account Information</h2>
              <StatusBadge status="Active" />
            </div>
            <div className="content-card__body">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'var(--color-primary-navy)',
                  }}
                >
                  {user?.name?.slice(0, 2).toUpperCase() || 'SG'}
                </div>
                <div>
                  <h3 className="h3 mb-0">{user?.name}</h3>
                  <div className="text-muted-custom small">{user?.email}</div>
                  <span
                    className={`badge mt-1 ${
                      role === 'BackofficeOfficer'
                        ? 'bg-primary-subtle text-primary border border-primary-subtle'
                        : role === 'Prosumer'
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        : 'bg-success-subtle text-success border border-success-subtle'
                    }`}
                  >
                    {role === 'BackofficeOfficer'
                      ? 'Backoffice Officer'
                      : role === 'Prosumer'
                      ? 'Prosumer'
                      : 'Grid Operator'}
                  </span>
                </div>
              </div>

              <div className="list-group list-group-flush border-top border-bottom mb-4">
                <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                  <span className="text-muted-custom">User ID</span>
                  <span className="font-monospace fw-semibold">{user?.id || 'USR-001'}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                  <span className="text-muted-custom">Security Role</span>
                  <span className="fw-semibold">{role}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                  <span className="text-muted-custom">API Authorization</span>
                  <span className="text-success fw-semibold">
                    <i className="bi bi-shield-check me-1"></i>JWT Bearer Verified
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="btn btn-outline-danger w-100 btn-sm"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Sign Out of Current Session
              </button>
            </div>
          </div>
        </div>

        {/* Right: Security / Change Password Form */}
        <div className="col-12 col-lg-7">
          <div className="content-card">
            <div className="content-card__header">
              <h2 className="content-card__title">Change Password</h2>
            </div>
            <div className="content-card__body">
              {errorMsg && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <FormSection
                  title="Credential Update"
                  description="Choose a strong password with at least 8 characters."
                >
                  <div className="col-12">
                    <label className="field-label" htmlFor="currentPassword">
                      Current Password <span className="required-star">*</span>
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="field-label" htmlFor="newPassword">
                      New Password <span className="required-star">*</span>
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span className="field-helper">Minimum 8 characters.</span>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="field-label" htmlFor="confirmPassword">
                      Confirm New Password <span className="required-star">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </FormSection>

                <FormActions
                  isSubmitting={isSubmitting}
                  submitLabel="Update Password"
                  submitVariant="primary"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
