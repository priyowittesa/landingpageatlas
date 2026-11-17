"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type FilterValues = Record<string, string>;

type FilterContextType = {
  filters: FilterValues;
  setFilter: (key: string, value: string) => void;
  setFilters: (values: Partial<FilterValues>) => void;
  resetFilter: (key: string) => void;
  resetFilters: () => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({
  children,
  defaultFilters,
}: {
  children: ReactNode;
  defaultFilters: FilterValues;
}) {
  const [filters, setFiltersState] = useState<FilterValues>(defaultFilters);

  const setFilter = (key: string, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  };

  const setFilters = (values: Partial<FilterValues>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined) as Array<
          [string, string]
        >,
      ),
    }));
  };

  const resetFilter = (key: string) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: defaultFilters[key] ?? "all",
    }));
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };

  return (
    <FilterContext.Provider
      value={{ filters, setFilter, setFilters, resetFilter, resetFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
