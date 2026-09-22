import React from 'react';

export default function EmptyState({
  title = 'No records found',
  description = 'There is currently no data to display matching your criteria.',
  icon = 'bi-inbox',
  action = null,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{ width: '64px', height: '64px', backgroundColor: '#F1F5F9', color: '#94A3B8' }}
      >
        <i className={`bi ${icon}`} style={{ fontSize: '1.75rem' }}></i>
      </div>
      <h3 className="h3 mb-1">{title}</h3>
      <p className="text-muted-custom small mb-3 mx-auto" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
