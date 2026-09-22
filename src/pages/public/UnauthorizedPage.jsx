import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const handleReturn = () => {
    if (role === 'BackofficeOfficer') {
      navigate('/backoffice/dashboard', { replace: true });
    } else if (role === 'GridOperator') {
      navigate('/operator/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="auth-card text-center" style={{ maxWidth: '460px' }}>
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3"
          style={{ backgroundColor: '#FEF2F2', color: 'var(--color-error)' }}
        >
          <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h1 className="h1 mb-2">403 - Access Denied</h1>
        <p className="text-muted-custom small mb-4">
          Your authenticated account role does not have administrative permission to view the requested
          resource or page.
        </p>
        <div className="d-flex flex-column gap-2">
          <button type="button" onClick={handleReturn} className="btn-primary-custom justify-content-center">
            <i className="bi bi-arrow-left me-1"></i> Return to Assigned Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="btn btn-sm btn-link text-muted-custom text-decoration-none"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
