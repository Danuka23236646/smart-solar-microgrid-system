import React from 'react';

export default function LoadingState({ rows = 5, cols = 4, type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="row g-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div className="summary-card">
              <div className="skeleton-box mb-2" style={{ height: '14px', width: '60%' }}></div>
              <div className="skeleton-box mb-2" style={{ height: '32px', width: '40%' }}></div>
              <div className="skeleton-box" style={{ height: '12px', width: '80%' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="d-flex align-items-center gap-3 py-2 border-bottom">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton-box"
              style={{
                height: '18px',
                flex: c === 0 ? 1.5 : 1,
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}
