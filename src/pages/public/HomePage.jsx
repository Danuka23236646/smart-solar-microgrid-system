import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="d-flex flex-column min-height-100vh bg-light">
      {/* Top Navigation */}
      <header className="navbar navbar-expand-lg bg-white border-bottom sticky-top px-4 py-3">
        <div className="container-fluid max-width-1400">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <div
              className="rounded p-2 d-flex align-items-center justify-content-center text-white"
              style={{ backgroundColor: 'var(--color-energy-green)', width: '36px', height: '36px' }}
            >
              <i className="bi bi-sun-fill fs-5"></i>
            </div>
            <div>
              <span className="fw-bold fs-5 text-dark" style={{ letterSpacing: '-0.02em' }}>
                SolarGrid
              </span>
              <span className="d-block text-muted-custom" style={{ fontSize: '0.68rem', lineHeight: 1 }}>
                Smart Solar Microgrid Trading System
              </span>
            </div>
          </Link>

          <div className="d-flex align-items-center gap-3">
            <Link to="/register" className="btn btn-outline-secondary text-decoration-none">
              <i className="bi bi-person-plus me-1"></i> Register as Prosumer
            </Link>
            <Link to="/login" className="btn-primary-custom text-decoration-none">
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign In to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section text-center text-lg-start">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-7">
              <span
                className="badge mb-3 px-3 py-2 text-uppercase fw-semibold"
                style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', color: 'var(--color-solar-amber)', fontSize: '0.75rem' }}
              >
                Enterprise Microgrid Platform
              </span>
              <h1 className="display-5 fw-bold text-white mb-3" style={{ lineHeight: 1.15 }}>
                Decentralized Energy Scheduling & Battery Storage Management
              </h1>
              <p className="lead text-white-50 mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                SolarGrid connects local solar prosumers with automated microgrid substations.
                Schedule forward energy transfers, monitor real-time battery slot telemetry, and
                maintain microgrid frequency stability with centralized C# Web API governance.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                <Link to="/login" className="btn btn-warning btn-lg fw-semibold px-4 text-dark">
                  Access Portal <i className="bi bi-arrow-right ms-1"></i>
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg fw-semibold px-4">
                  <i className="bi bi-person-plus me-1"></i> Register as Prosumer
                </Link>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              {/* Professional Technical Illustration Placeholder */}
              <div
                className="rounded-3 p-4 border"
                style={{
                  backgroundColor: 'rgba(7, 20, 38, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="api-status-dot"></span>
                    <span className="text-white-50 font-monospace small">TELEMETRY SIMULATOR</span>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    7-Day Horizon
                  </span>
                </div>

                <div className="row g-2 text-start">
                  <div className="col-6">
                    <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                      <div className="text-white-50 small mb-1">Active Substation Load</div>
                      <div className="text-white fw-bold fs-4">68.4%</div>
                      <div className="text-success small">Healthy Frequency</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                      <div className="text-white-50 small mb-1">Available Bays</div>
                      <div className="text-warning fw-bold fs-4">17 / 24</div>
                      <div className="text-white-50 small">Battery Modules</div>
                    </div>
                  </div>
                  <div className="col-12 mt-2">
                    <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                      <div className="d-flex justify-content-between text-white-50 small mb-2">
                        <span>Solar Power Ingestion Rate</span>
                        <span className="text-warning">380 kW / 500 kW</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{ width: '76%' }}
                          aria-valuenow="76"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="h2 fw-bold text-dark">Microgrid Trading Architecture</h2>
            <p className="text-muted-custom mx-auto small" style={{ maxWidth: '600px' }}>
              Built for compliance with the SE4040 University Specification, integrating modular C# Web API endpoints, role-governed authorization, and strict business rule boundaries.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="hero-feature-card">
                <div
                  className="rounded p-3 d-inline-flex mb-3"
                  style={{ backgroundColor: '#EFF6FF', color: 'var(--color-info-blue)' }}
                >
                  <i className="bi bi-hdd-network fs-3"></i>
                </div>
                <h3 className="h3 mb-2">Substation Infrastructure</h3>
                <p className="text-muted-custom small mb-0">
                  Microgrid nodes host configurable battery storage bays with real-time state-of-charge, operational temperature metrics, and maintenance locks.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="hero-feature-card">
                <div
                  className="rounded p-3 d-inline-flex mb-3"
                  style={{ backgroundColor: '#ECFDF5', color: 'var(--color-energy-green)' }}
                >
                  <i className="bi bi-journal-check fs-3"></i>
                </div>
                <h3 className="h3 mb-2">Forward Energy Bookings</h3>
                <p className="text-muted-custom small mb-0">
                  Prosumers schedule energy injection or draw reservations within an automated 7-day forward horizon, backed by strict 12-hour modification locks.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="hero-feature-card">
                <div
                  className="rounded p-3 d-inline-flex mb-3"
                  style={{ backgroundColor: '#FFFBEB', color: 'var(--color-solar-amber)' }}
                >
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
                <h3 className="h3 mb-2">Role Governance</h3>
                <p className="text-muted-custom small mb-0">
                  Decoupled authorization profiles for Backoffice Officers and Grid Operators ensure sensitive parameters and activation queues are protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 bg-light border-top text-center text-muted-custom small">
        <div className="container">
          <div>Smart Solar Microgrid Trading System &copy; 2026. Academic Enterprise Showcase.</div>
          <div className="mt-1">Designed with React, Vite, Bootstrap 5 & Centralized C# Web API Integration.</div>
        </div>
      </footer>
    </div>
  );
}
