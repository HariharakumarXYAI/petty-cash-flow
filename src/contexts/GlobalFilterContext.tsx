import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Country } from "@/lib/mock-data";

interface DateRange {
  from: Date;
  to: Date;
}

interface GlobalFilterState {
  country: Country | "all";
  storeId: string;
  dateRange: DateRange;
  searchQuery: string;
  setCountry: (c: Country | "all") => void;
  setStoreId: (id: string) => void;
  setDateRange: (range: DateRange) => void;
  setSearchQuery: (q: string) => void;
}

const GlobalFilterContext = createContext<GlobalFilterState | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<Country | "all">("all");
  const [storeId, setStoreId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2026, 2, 1), // March 1, 2026
    to: new Date(2026, 2, 6),   // March 6, 2026
  });
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <GlobalFilterContext.Provider value={{
      country, storeId, dateRange, searchQuery,
      setCountry: (c) => { setCountry(c); if (c !== country) setStoreId("all"); },
      setStoreId, setDateRange, setSearchQuery,
    }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx) throw new Error("useGlobalFilter must be used within GlobalFilterProvider");
  return ctx;
}
