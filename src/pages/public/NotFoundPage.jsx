import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleReturn = () => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    } else if (role === 'BackofficeOfficer') {
      navigate('/backoffice/dashboard', { replace: true });
    } else if (role === 'GridOperator') {
      navigate('/operator/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="auth-card text-center" style={{ maxWidth: '440px' }}>
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3"
          style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
        >
          <i className="bi bi-question-circle-fill" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h1 className="h1 mb-2">404 - Page Not Found</h1>
        <p className="text-muted-custom small mb-4">
          The microgrid route, substation identifier, or resource you requested could not be located.
        </p>
        <button type="button" onClick={handleReturn} className="btn-primary-custom justify-content-center w-100">
          <i className="bi bi-house-door me-1"></i> Return to Safety
        </button>
      </div>
    </div>
  );
}
