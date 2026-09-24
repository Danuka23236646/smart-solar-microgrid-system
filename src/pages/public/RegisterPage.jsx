import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProsumer } from '../../services/prosumerService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    email: '',
    phoneNumber: '',
    address: '',
    solarCapacityKw: 5.0,
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
    setApiError('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return 'Full Name is required.';
    if (!formData.nic.trim()) return 'National Identity Card (NIC) is required.';
    
    // Sri Lankan NIC check: 9 digits + V/X or 12 digits
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(formData.nic.trim())) {
      return 'Invalid NIC format. Enter 9 digits followed by V/X (e.g. 199512345V) or modern 12 digits (e.g. 200012345678).';
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      return 'Valid Email Address is required.';
    }
    if (!formData.phoneNumber.trim()) return 'Phone Number is required.';
    if (!formData.address.trim()) return 'Residential / Installation Address is required.';
    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createProsumer({
        fullName: formData.fullName.trim(),
        nic: formData.nic.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        solarCapacityKw: parseFloat(formData.solarCapacityKw) || 5.0,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setRegisteredUser(result);
      setIsSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Info Panel */}
      <div className="auth-split-left">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div
            className="rounded p-2 d-flex align-items-center justify-content-center text-white"
            style={{ backgroundColor: 'var(--color-energy-green)', width: '38px', height: '38px' }}
          >
            <i className="bi bi-sun-fill fs-5"></i>
          </div>
          <div>
            <div className="fw-bold fs-5 text-white" style={{ letterSpacing: '-0.02em' }}>
              SolarGrid
            </div>
            <div className="text-white-50" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
              ENERGY TRADING PLATFORM
            </div>
          </div>
        </div>

        <div className="my-auto">
          <span
            className="badge mb-3 px-3 py-2 text-uppercase fw-semibold"
            style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-solar-amber)', fontSize: '0.72rem' }}
          >
            Prosumer Onboarding
          </span>
          <h1 className="h2 fw-bold text-white mb-3" style={{ lineHeight: 1.2 }}>
            Join the Smart Solar Microgrid Network
          </h1>
          <p className="text-white-50 small mb-4" style={{ lineHeight: 1.6 }}>
            Register your distributed solar installation to trade excess renewable energy,
            reserve high-efficiency battery storage bays, and access verified microgrid telemetry.
          </p>

          <div className="p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <div className="fw-semibold text-white small mb-2">Registration Workflow:</div>
            <div className="small text-white-50">
              <div className="mb-2 d-flex align-items-center gap-2">
                <span className="badge text-bg-warning rounded-circle px-2 py-1">1</span>
                Submit verified national identity & solar installation data
              </div>
              <div className="mb-2 d-flex align-items-center gap-2">
                <span className="badge text-bg-info rounded-circle px-2 py-1">2</span>
                Backoffice compliance review & station assignment
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge text-bg-success rounded-circle px-2 py-1">3</span>
                Immediate activation for automated 7-day energy trading
              </div>
            </div>
          </div>
        </div>

        <div className="text-white-50 small pt-4 mt-auto border-top border-secondary border-opacity-25">
          SE4040 Enterprise Application Development &copy; 2026
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-split-right">
        <div className="auth-card" style={{ maxWidth: '540px' }}>
          {isSuccess ? (
            <div className="text-center py-4">
              <div
                className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3 shadow"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-check-lg fs-1"></i>
              </div>
              <h2 className="h3 fw-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-custom small mb-4">
                Your Prosumer profile has been successfully submitted to the SunGrid network with reference{' '}
                <strong>{registeredUser?.nic || formData.nic}</strong>.
              </p>

              <div className="alert alert-info text-start small mb-4">
                <div className="fw-semibold mb-1">
                  <i className="bi bi-info-circle-fill me-1"></i> Account Status: Pending Approval
                </div>
                Your account is currently in <strong>Pending</strong> status awaiting compliance review by a Backoffice Officer. Once approved, your credentials will allow you to sign in.
              </div>

              <div className="d-flex flex-column gap-2">
                <Link to="/login" className="btn btn-primary-custom py-2 justify-content-center">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Return to Sign In
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-secondary py-2"
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      fullName: '',
                      nic: '',
                      email: '',
                      phoneNumber: '',
                      address: '',
                      solarCapacityKw: 5.0,
                      password: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Register Another Prosumer
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <h1 className="h2 mb-1">Create Account</h1>
                <p className="text-muted-custom small mb-0">
                  Register as a solar prosumer to connect your generation capacity.
                </p>
              </div>

              {validationError && (
                <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small mb-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <div>{validationError}</div>
                </div>
              )}

              {apiError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3" role="alert">
                  <i className="bi bi-shield-x"></i>
                  <div>{apiError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      Full Legal Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className="form-control"
                      placeholder="e.g. Sunil Perera"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      NIC Number <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="nic"
                      className="form-control"
                      placeholder="199512345V or 2000..."
                      value={formData.nic}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      Email Address <span className="required-star">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="prosumer@solar.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      Phone Number <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      className="form-control"
                      placeholder="+94 77 123 4567"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="field-label">
                      Installation Address <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      placeholder="No. 45, Temple Road, Colombo"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="field-label">
                      Estimated Solar Capacity (kW)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      name="solarCapacityKw"
                      className="form-control"
                      placeholder="5.0"
                      value={formData.solarCapacityKw}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      Password <span className="required-star">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="field-label">
                      Confirm Password <span className="required-star">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary-custom w-100 py-2 justify-content-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check-fill me-1"></i> Submit Registration
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mt-3 pt-3 border-top">
                <span className="text-muted-custom small">Already registered? </span>
                <Link to="/login" className="fw-semibold text-primary text-decoration-none small">
                  Sign In to Portal
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
