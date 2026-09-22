import React, { useEffect } from 'react';

export default function ConfirmationDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you wish to proceed with this operation?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
  children = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" role="presentation" onClick={onCancel}>
      <div
        className="modal-dialog-custom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h3 id="modal-dialog-title" className="h3 mb-0">
            {title}
          </h3>
          <button
            type="button"
            className="btn-close"
            aria-label="Close modal"
            onClick={onCancel}
            disabled={isLoading}
          ></button>
        </div>
        <div className="modal-body-custom">
          <p className="text-muted-custom small mb-2">{message}</p>
          {children}
        </div>
        <div className="modal-footer-custom">
          <button
            type="button"
            className="btn-secondary-custom"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'btn-danger-custom' : 'btn-primary-custom'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
