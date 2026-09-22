import React from 'react';

export default function SummaryCard({
  title,
  value,
  meta,
  icon = 'bi-activity',
  variant = 'navy',
  badge = null,
}) {
  return (
    <div className="summary-card">
      <div>
        <div className="summary-card__header">
          <span className="summary-card__title">{title}</span>
          <div className={`summary-card__icon-wrapper summary-card__icon-wrapper--${variant}`}>
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
        <div className="d-flex align-items-baseline gap-2">
          <div className="card-value">{value}</div>
          {badge && <div>{badge}</div>}
        </div>
      </div>
      {meta && <div className="summary-card__meta">{meta}</div>}
    </div>
  );
}
