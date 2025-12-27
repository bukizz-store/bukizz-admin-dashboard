import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300"
        >
          <ToastItem {...toast} onRemove={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  );
};

const ToastItem = ({ type, message, onRemove }) => {
  const styles = {
    success: {
      border: "border-green-500",
      icon: CheckCircle,
      color: "text-green-500",
    },
    error: {
      border: "border-red-500",
      icon: AlertCircle,
      color: "text-red-500",
    },
    warning: {
      border: "border-yellow-500",
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    info: {
      border: "border-blue-500",
      icon: AlertCircle,
      color: "text-blue-500",
    }, // Default blue for info
  };

  const currentStyle = styles[type] || styles.info;
  const Icon = currentStyle.icon;

  return (
    <div
      className={`flex items-center gap-3 bg-white p-4 rounded-md shadow-lg border-l-4 ${currentStyle.border} min-w-[300px] max-w-sm`}
    >
      <Icon className={`${currentStyle.color} shrink-0`} size={20} />
      <p className="text-sm font-medium text-slate-700 flex-1">{message}</p>
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
