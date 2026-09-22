import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout, isBackoffice, isOperator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'SG';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1025 }}
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'show' : ''}`}
        aria-label="Application Main Sidebar"
      >
        {/* Brand Header */}
        <div className="app-sidebar__header justify-content-between">
          <div className="app-sidebar__brand">
            <div className="app-sidebar__brand-logo">
              <i className="bi bi-sun-fill"></i>
            </div>
            <div>
              <div className="app-sidebar__brand-text">SolarGrid</div>
              <span className="app-sidebar__brand-sub">Trading & Microgrid</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm text-white d-lg-none"
            aria-label="Close sidebar navigation"
            onClick={onClose}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Role-Filtered Navigation Links */}
        <nav className="app-sidebar__nav">
          {isBackoffice && (
            <>
              <div className="app-sidebar__section-title">Operations & Admin</div>
              <NavLink
                to="/backoffice/dashboard"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/backoffice/users"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-people"></i>
                <span>Web Users</span>
              </NavLink>

              <NavLink
                to="/backoffice/prosumers"
                end
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-person-badge"></i>
                <span>Prosumers</span>
              </NavLink>

              <NavLink
                to="/backoffice/prosumers/pending"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-clock-history"></i>
                <span>Pending Activations</span>
                <span className="app-sidebar__badge">2</span>
              </NavLink>

              <div className="app-sidebar__section-title">Microgrid Assets</div>
              <NavLink
                to="/backoffice/nodes"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-hdd-network"></i>
                <span>Microgrid Nodes</span>
              </NavLink>

              <NavLink
                to="/backoffice/reservations"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-journal-check"></i>
                <span>Reservations</span>
              </NavLink>
            </>
          )}

          {isOperator && (
            <>
              <div className="app-sidebar__section-title">Grid Dispatch & Control</div>
              <NavLink
                to="/operator/dashboard"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-speedometer"></i>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/operator/nodes"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-cpu"></i>
                <span>Grid Nodes</span>
              </NavLink>

              <NavLink
                to="/operator/battery-availability"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-battery-half"></i>
                <span>Battery Availability</span>
              </NavLink>

              <div className="app-sidebar__section-title">Energy Transfers</div>
              <NavLink
                to="/operator/reservations/pending"
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-hourglass-split"></i>
                <span>Pending Reservations</span>
                <span className="app-sidebar__badge">2</span>
              </NavLink>

              <NavLink
                to="/operator/reservations"
                end
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-calendar2-range"></i>
                <span>All Reservations</span>
              </NavLink>
            </>
          )}

          <div className="app-sidebar__section-title">Account</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-person-circle"></i>
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Footer User Info & Quick Logout */}
        <div className="app-sidebar__footer">
          <div className="d-flex align-items-center justify-content-between">
            <div className="app-sidebar__user-pill">
              <div className="app-sidebar__avatar">{getInitials(user?.name)}</div>
              <div className="overflow-hidden" style={{ maxWidth: '130px' }}>
                <div className="text-truncate fw-semibold small text-white">{user?.name || 'User'}</div>
                <div className="text-truncate text-muted-custom" style={{ fontSize: '0.7rem' }}>
                  {role === 'BackofficeOfficer' ? 'Backoffice Officer' : 'Grid Operator'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm text-danger p-1"
              title="Sign Out"
              aria-label="Sign Out"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
