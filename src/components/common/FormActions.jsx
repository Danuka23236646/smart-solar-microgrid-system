import React from 'react';

export default function FormActions({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Changes',
  isSubmitting = false,
  submitVariant = 'primary',
}) {
  return (
    <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary-custom"
          disabled={isSubmitting}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        className={submitVariant === 'success' ? 'btn-success-custom' : 'btn-primary-custom'}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
