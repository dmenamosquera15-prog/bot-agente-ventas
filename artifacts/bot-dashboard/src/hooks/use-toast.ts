import { useState, useEffect } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...props, id };
  toasts = [...toasts, newToast];
  emitChange();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 5000);
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  return {
    toasts: currentToasts,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        toasts = toasts.filter((t) => t.id !== toastId);
      } else {
        toasts = [];
      }
      emitChange();
    },
  };
}
