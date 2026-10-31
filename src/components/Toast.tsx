import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

export interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
    action?: ToastAction
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string,
    type: ToastType = 'success',
    duration = 3200,
    action?: ToastAction
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, action }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-[400px] pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarn = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-warm-lg border flex items-center justify-between gap-3 text-white transition-all transform animate-fade-in ${
                isSuccess
                  ? 'bg-leafGreen border-leafGreen-dark'
                  : isWarn
                  ? 'bg-turmeric-dark border-turmeric text-warmBrown'
                  : isError
                  ? 'bg-danger border-red-700'
                  : 'bg-warmBrown border-warmBrown-muted'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {isSuccess && <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                {isWarn && <AlertTriangle className="w-6 h-6 flex-shrink-0 text-warmBrown" />}
                {isError && <AlertCircle className="w-6 h-6 flex-shrink-0" />}
                <span className="font-bold text-sm sm:text-base leading-snug truncate">
                  {toast.message}
                </span>
              </div>

              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="px-2.5 py-1 bg-white text-warmBrown text-xs font-black rounded-lg hover:bg-cream active:scale-95 transition-transform flex-shrink-0"
                >
                  {toast.action.label}
                </button>
              )}

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
                aria-label="Close Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
