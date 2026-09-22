import React from 'react';

export default function ErrorState({
  title = 'Failed to load system data',
  message = 'An unexpected error occurred while communicating with the Centralized API Gateway.',
  onRetry = null,
  errorCode = null,
}) {
  return (
    <div className="content-card border-danger-subtle my-3" role="alert">
      <div className="content-card__body d-flex align-items-start gap-3">
        <div
          className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-danger-subtle text-danger"
          style={{ width: '40px', height: '40px' }}
        >
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.25rem' }}></i>
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center justify-content-between">
            <h3 className="h3 text-danger mb-1">{title}</h3>
            {errorCode && <span className="badge text-bg-light border font-monospace">{errorCode}</span>}
          </div>
          <p className="text-muted-custom small mb-2">{message}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-sm btn-outline-danger">
              <i className="bi bi-arrow-clockwise me-1"></i>Retry Operation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
