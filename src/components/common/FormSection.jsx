import React from 'react';

export default function FormSection({ title, description = '', children }) {
  return (
    <fieldset className="form-section-fieldset">
      {title && <legend className="form-section-legend">{title}</legend>}
      {description && <p className="text-muted-custom small mb-3">{description}</p>}
      <div className="row g-3">{children}</div>
    </fieldset>
  );
}
