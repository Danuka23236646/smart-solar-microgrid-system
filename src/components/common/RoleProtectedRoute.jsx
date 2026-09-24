import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleProtectedRoute({ allowedRoles = [], children }) {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.some((r) => {
    if ((r === 'BackofficeOfficer' || r === 'Backoffice') && (role === 'Backoffice' || role === 'BackofficeOfficer')) {
      return true;
    }
    return r === role;
  });

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
