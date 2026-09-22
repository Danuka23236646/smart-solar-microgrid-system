import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => addToast('success', message, title), [addToast]);
  const showError = useCallback((message, title = 'System Error') => addToast('error', message, title), [addToast]);
  const showWarning = useCallback((message, title = 'Attention') => addToast('warning', message, title), [addToast]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning }}>
      {children}
      <div className="toast-stack-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-item--${toast.type}`}
            role="alert"
          >
            <i
              className={`bi ${
                toast.type === 'success'
                  ? 'bi-check-circle-fill text-success'
                  : toast.type === 'error'
                  ? 'bi-exclamation-triangle-fill text-danger'
                  : 'bi-exclamation-circle-fill text-warning'
              }`}
              style={{ fontSize: '1.25rem' }}
            ></i>
            <div className="flex-grow-1">
              {toast.title && <div className="fw-semibold small">{toast.title}</div>}
              <div className="text-muted-custom small">{toast.message}</div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              aria-label="Close"
              onClick={() => removeToast(toast.id)}
            ></button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
