import React from 'react';
import Breadcrumb from './Breadcrumb';

export default function PageHeader({ title, description, breadcrumbItems = [], actions = null }) {
  return (
    <div className="mb-4">
      {breadcrumbItems.length > 0 && <Breadcrumb items={breadcrumbItems} />}
      <div className="d-flex align-items-sm-center justify-content-between flex-column flex-sm-row gap-2 mt-1">
        <div>
          <h1 className="h1 mb-0">{title}</h1>
          {description && <p className="text-muted-custom mb-0 small mt-1">{description}</p>}
        </div>
        {actions && <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">{actions}</div>}
      </div>
    </div>
  );
}
