import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  emptyIcon = 'bi-inbox',
  emptyAction = null,
  rowClassName = null,
}) {
  if (isLoading) {
    return (
      <div className="content-card">
        <LoadingState rows={5} cols={columns.length} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="content-card">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="table-responsive-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => {
              const rowKey = item[keyField] || rowIdx;
              const customClass = rowClassName ? rowClassName(item) : '';
              return (
                <tr key={rowKey} className={customClass}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(item, rowIdx) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
