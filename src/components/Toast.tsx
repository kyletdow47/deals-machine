"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const accentColors = {
    success: "border-l-primary",
    error: "border-l-error",
    info: "border-l-primary-container",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-surface-container-lowest border border-outline-variant/20 ${accentColors[t.type]} border-l-4 rounded-xl px-5 py-4 shadow-2xl animate-slideInRight flex items-center gap-3 min-w-[280px]`}
          >
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icons[t.type]}
            </span>
            <p className="text-sm font-medium text-on-surface">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
