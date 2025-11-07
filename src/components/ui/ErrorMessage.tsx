"use client";

import { useState, useEffect } from "react";

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export function ErrorMessage({ message, onClose, duration = 5000 }: ErrorMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-in slide-in-from-top"
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="text-white hover:text-gray-200 font-bold"
        aria-label="Close error message"
      >
        ×
      </button>
    </div>
  );
}

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export function SuccessMessage({ message, onClose, duration = 3000 }: SuccessMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-in slide-in-from-top"
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="text-white hover:text-gray-200 font-bold"
        aria-label="Close success message"
      >
        ×
      </button>
    </div>
  );
}

