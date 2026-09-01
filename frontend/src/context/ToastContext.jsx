import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          let bg = '#182019';
          let border = '#2f3e31';
          let iconColor = '#8fae8b';
          let IconComp = Info;

          if (t.type === 'success') {
            bg = '#142718';
            border = '#2d5835';
            iconColor = '#4cd964';
            IconComp = CheckCircle2;
          } else if (t.type === 'error') {
            bg = '#2a1414';
            border = '#5e2424';
            iconColor = '#ff5b5b';
            IconComp = AlertCircle;
          } else if (t.type === 'warning') {
            bg = '#2b2313';
            border = '#5b4a20';
            iconColor = '#ffcc00';
            IconComp = AlertTriangle;
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color: '#e5eae4',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                fontFamily: 'sans-serif',
                fontSize: '0.88rem',
                lineHeight: '1.4',
              }}
            >
              <IconComp size={18} style={{ color: iconColor, flexShrink: 0 }} />
              <div style={{ flex: 1, fontWeight: 500 }}>{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8fae8b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (msg) => console.log('Toast:', msg),
      toast: {
        success: (msg) => console.log('Toast Success:', msg),
        error: (msg) => console.log('Toast Error:', msg),
        warning: (msg) => console.log('Toast Warning:', msg),
        info: (msg) => console.log('Toast Info:', msg),
      },
    };
  }
  return ctx;
}
