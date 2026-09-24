import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="app-header__toggle-btn"
          aria-label="Toggle navigation drawer"
          onClick={onToggleSidebar}
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        <div className="d-none d-sm-flex align-items-center gap-2">
          <span className="api-status-pill">
            <span className="api-status-dot"></span>
            <span>API Gateway: Online</span>
          </span>
        </div>
      </div>

      <div className="app-header__right">
        {/* Role Badge */}
        {role === 'BackofficeOfficer' ? (
          <span className="role-badge role-badge--backoffice">
            <i className="bi bi-shield-check"></i>
            <span>Backoffice Officer</span>
          </span>
        ) : role === 'Prosumer' ? (
          <span className="role-badge" style={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#d97706', border: '1px solid rgba(245, 166, 35, 0.3)' }}>
            <i className="bi bi-person-badge"></i>
            <span>Prosumer</span>
          </span>
        ) : (
          <span className="role-badge role-badge--operator">
            <i className="bi bi-cpu-fill"></i>
            <span>Grid Operator</span>
          </span>
        )}

        {/* User Dropdown */}
        <div className="app-header__user-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="app-header__user-trigger"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: 'var(--color-primary-navy)',
                fontSize: '0.8rem',
              }}
            >
              {getInitials(user?.name)}
            </div>
            <span className="d-none d-md-inline fw-semibold small">{user?.name}</span>
            <i className="bi bi-chevron-down small text-muted-custom"></i>
          </button>

          {dropdownOpen && (
            <div className="app-header__dropdown-menu" role="menu">
              <div className="px-3 py-2 border-bottom">
                <div className="fw-semibold small text-truncate">{user?.name}</div>
                <div className="text-muted-custom small text-truncate" style={{ fontSize: '0.72rem' }}>
                  {user?.email}
                </div>
              </div>
              <Link
                to="/profile"
                className="app-header__dropdown-item"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="bi bi-person me-1"></i> My Profile
              </Link>
              <div className="dropdown-divider my-1"></div>
              <button
                type="button"
                className="app-header__dropdown-item danger-item"
                role="menuitem"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-1"></i> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
