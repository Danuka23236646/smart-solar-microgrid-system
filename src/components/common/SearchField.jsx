import React from 'react';

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search records...',
  ariaLabel = 'Search table records',
}) {
  return (
    <div className="search-input-group">
      <i className="bi bi-search"></i>
      <input
        type="search"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  );
}
