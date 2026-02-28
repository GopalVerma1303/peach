import React, { createContext, useContext, useState, useCallback } from 'react';

type AlertType = 'error' | 'success' | 'info';

interface AlertMessage {
  id: number;
  type: AlertType;
  message: string;
}

interface AlertContextValue {
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  alerts: AlertMessage[];
  dismiss: (id: number) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

let nextId = 0;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const add = useCallback((type: AlertType, message: string) => {
    const id = ++nextId;
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setAlerts((prev) => prev.filter((a) => a.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <AlertContext.Provider
      value={{
        error: (msg) => add('error', msg),
        success: (msg) => add('success', msg),
        info: (msg) => add('info', msg),
        alerts,
        dismiss,
      }}
    >
      {children}
      <div
        className="alert-container"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {alerts.map((a) => (
          <div
            key={a.id}
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: a.type === 'error' ? '#fee' : a.type === 'success' ? '#efe' : '#eef',
              color: a.type === 'error' ? '#c00' : 'var(--text)',
              border: '1px solid var(--border)',
              maxWidth: 360,
            }}
          >
            {a.message}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(a.id)}
              style={{ marginLeft: 8, background: 'transparent', color: 'inherit', padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) return { error: () => {}, success: () => {}, info: () => {}, alerts: [], dismiss: () => {} };
  return ctx;
}
