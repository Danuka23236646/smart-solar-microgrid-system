import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="breadcrumb mb-0 py-1" style={{ fontSize: '0.78rem' }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast ? (
            <li key={index} className="breadcrumb-item active text-muted-custom" aria-current="page">
              {item.label}
            </li>
          ) : (
            <li key={index} className="breadcrumb-item">
              <Link to={item.path} className="text-decoration-none" style={{ color: 'var(--color-info-blue)' }}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
