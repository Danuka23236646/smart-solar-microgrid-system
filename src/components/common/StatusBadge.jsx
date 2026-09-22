import React from 'react';

const STATUS_CONFIG = {
  Active: {
    className: 'status-badge--active',
    icon: 'bi-check-circle-fill',
    label: 'Active',
  },
  Approved: {
    className: 'status-badge--approved',
    icon: 'bi-check-circle',
    label: 'Approved',
  },
  Pending: {
    className: 'status-badge--pending',
    icon: 'bi-clock-history',
    label: 'Pending',
  },
  Completed: {
    className: 'status-badge--completed',
    icon: 'bi-check2-all',
    label: 'Completed',
  },
  Inactive: {
    className: 'status-badge--inactive',
    icon: 'bi-dash-circle',
    label: 'Inactive',
  },
  Cancelled: {
    className: 'status-badge--cancelled',
    icon: 'bi-x-circle-fill',
    label: 'Cancelled',
  },
  'Deactivation Requested': {
    className: 'status-badge--deactivation-requested',
    icon: 'bi-exclamation-octagon-fill',
    label: 'Deact. Requested',
  },
  Available: {
    className: 'status-badge--active',
    icon: 'bi-lightning-charge-fill',
    label: 'Available',
  },
  Reserved: {
    className: 'status-badge--approved',
    icon: 'bi-shield-lock-fill',
    label: 'Reserved',
  },
  Unavailable: {
    className: 'status-badge--cancelled',
    icon: 'bi-slash-circle-fill',
    label: 'Unavailable',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    className: 'status-badge--inactive',
    icon: 'bi-info-circle',
    label: status || 'Unknown',
  };

  return (
    <span className={`status-badge ${config.className}`} role="status">
      <i className={`bi ${config.icon}`} aria-hidden="true"></i>
      <span>{config.label}</span>
    </span>
  );
}
