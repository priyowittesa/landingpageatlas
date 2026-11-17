"use client";

import * as React from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function ResponsiveSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      collapsed,
      setCollapsed,
      toggleCollapsed,
    }),
    [sidebarOpen, collapsed, toggleCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within ResponsiveSidebarProvider");
  }
  return context;
}
