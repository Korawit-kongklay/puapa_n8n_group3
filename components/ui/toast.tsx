import React, { useEffect } from "react";

interface ToastProps {
  type: "success" | "error";
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number; // ms
}

export const Toast: React.FC<ToastProps> = ({ type, message, show, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <div
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      style={{ minWidth: 320, maxWidth: 400 }}
      aria-live="polite"
    >
      <div
        className={`flex items-center px-5 py-4 rounded-xl shadow-lg border-2 bg-white/90 backdrop-blur-md space-x-3 ${
          type === "success"
            ? "border-green-300"
            : "border-red-300"
        }`}
      >
        {type === "success" ? (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
        <div className={`flex-1 font-medium ${type === "success" ? "text-green-800" : "text-red-800"}`}>{message}</div>
      </div>
    </div>
  );
}; 