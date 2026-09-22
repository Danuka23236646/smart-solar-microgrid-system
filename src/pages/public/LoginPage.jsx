import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { showSuccess } = useNotification();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  const fromPath = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    if (!identifier.trim()) {
      setValidationError('Please enter your system email or username.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your account password.');
      return;
    }

    try {
      const result = await login({ identifier: identifier.trim(), password });
      showSuccess(`Welcome back, ${result.user.name}!`);

      if (fromPath && fromPath !== '/login' && fromPath !== '/') {
        navigate(fromPath, { replace: true });
      } else if (result.role === 'BackofficeOfficer') {
        navigate('/backoffice/dashboard', { replace: true });
      } else if (result.role === 'GridOperator') {
        navigate('/operator/dashboard', { replace: true });
      } else {
        navigate('/unauthorized', { replace: true });
      }
    } catch (err) {
      setApiError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const setDemoCredentials = (email) => {
    setIdentifier(email);
    setPassword('Solar@123');
    setValidationError('');
    setApiError('');
  };

  return (
    <div className="auth-split-container">
      {/* Left Branding Panel */}
      <div className="auth-split-left">
        <div>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div
              className="rounded p-2 d-flex align-items-center justify-content-center text-white"
              style={{ backgroundColor: 'var(--color-energy-green)', width: '40px', height: '40px' }}
            >
              <i className="bi bi-sun-fill fs-4"></i>
            </div>
            <div>
              <span className="fw-bold fs-4 text-white" style={{ letterSpacing: '-0.02em' }}>
                SolarGrid
              </span>
              <span className="d-block text-warning small text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>
                Energy Trading Platform
              </span>
            </div>
          </div>

          <h2 className="display-6 fw-bold text-white mb-3" style={{ lineHeight: 1.2 }}>
            Smart Solar Microgrid Trading System
          </h2>
          <p className="text-white-50 small mb-4" style={{ lineHeight: 1.6, maxWidth: '420px' }}>
            Enterprise utility dashboard for prosumer lifecycle management, localized battery storage bay
            reservation, and substation telemetry monitoring.
          </p>

          {/* Microgrid Illustration Placeholder */}
          <div
            className="rounded p-3 border border-secondary border-opacity-25"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', maxWidth: '420px' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-white-50 font-monospace small">C# WEB API CORE</span>
              <span className="badge bg-success-subtle text-success">Online</span>
            </div>
            <div className="small text-white-50">
              <div className="mb-1"><i className="bi bi-check2 text-success me-2"></i>Automated 7-Day Trading Window</div>
              <div className="mb-1"><i className="bi bi-check2 text-success me-2"></i>12-Hour Cancellation Rule Lock</div>
              <div><i className="bi bi-check2 text-success me-2"></i>Role-Governed API JWT Authorization</div>
            </div>
          </div>
        </div>

        <div className="text-white-50 small pt-4 mt-auto border-top border-secondary border-opacity-25">
          SE4040 Enterprise Application Development &copy; 2026
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="auth-split-right">
        <div className="auth-card">
          <div className="text-center mb-4">
            <h1 className="h1 mb-1">Sign In</h1>
            <p className="text-muted-custom small mb-0">
              Enter your credentials to access your assigned portal.
            </p>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small mb-3" role="alert">
              <i className="bi bi-exclamation-circle-fill"></i>
              <div>{validationError}</div>
            </div>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3" role="alert">
              <i className="bi bi-shield-x"></i>
              <div>{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="identifier" className="field-label">
                Email / Username <span className="required-star">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted-custom border-end-0">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="email"
                  id="identifier"
                  className="form-control border-start-0"
                  placeholder="e.g. officer@solar.local"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="field-label">
                Password <span className="required-star">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted-custom border-end-0">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control border-start-0 border-end-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-white text-muted-custom border-start-0"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="form-check-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" className="form-check-label text-muted-custom small">
                  Remember my session
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary-custom w-100 py-2 justify-content-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Authenticating Session...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-1"></i> Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator Helper Box */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted-custom fw-semibold" style={{ fontSize: '0.72rem' }}>
                EVALUATION CREDENTIAL SHORTCUTS:
              </span>
              <span className="badge text-bg-light border small" style={{ fontSize: '0.65rem' }}>
                Pwd: Solar@123
              </span>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-50 small"
                onClick={() => setDemoCredentials('officer@solar.local')}
              >
                <i className="bi bi-shield-check me-1 text-primary"></i>Backoffice
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-50 small"
                onClick={() => setDemoCredentials('operator@solar.local')}
              >
                <i className="bi bi-cpu me-1 text-success"></i>Grid Operator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
