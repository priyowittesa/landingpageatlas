"use client";

import { createContext, useCallback, useContext } from "react";
import { toast } from "sonner";

type NotificationType = "success" | "error" | "info" | "warning";

type NotificationContextValue = {
  showNotification: (type: NotificationType, title: string, description?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const showNotification = useCallback(
    (type: NotificationType, title: string, description?: string) => {
      switch (type) {
        case "success":
          toast.success(title, { description });
          break;
        case "error":
          toast.error(title, { description });
          break;
        case "info":
          toast.info(title, { description });
          break;
        case "warning":
          toast.warning(title, { description });
          break;
      }
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
}
