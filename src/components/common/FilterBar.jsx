import React from 'react';

export default function FilterBar({ children, onReset, hasActiveFilters = false }) {
  return (
    <div className="filter-bar">
      {children}
      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-sm btn-link text-decoration-none text-muted-custom ms-auto"
        >
          <i className="bi bi-x-circle me-1"></i>Reset Filters
        </button>
      )}
    </div>
  );
}
