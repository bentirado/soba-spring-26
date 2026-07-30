import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const dashboardRangeOptions = ["All Time", "Last 3 Years", "This Year", "This Quarter"] as const;

export type DashboardRangeLabel = (typeof dashboardRangeOptions)[number];

export const dashboardRangeParamByLabel: Record<DashboardRangeLabel, string> = {
  "All Time": "all_time",
  "Last 3 Years": "last_3_years",
  "This Year": "this_year",
  "This Quarter": "this_quarter",
};

const dashboardRangeStorageKey = "dashboardDateRange";

type DashboardRangeContextValue = {
  selectedRange: DashboardRangeLabel;
  selectedRangeParam: string;
  setSelectedRange: (range: DashboardRangeLabel) => void;
};

const DashboardRangeContext = createContext<DashboardRangeContextValue | null>(null);

export function DashboardRangeProvider({ children }: { children: ReactNode }) {
  const [selectedRange, setSelectedRangeState] = useState<DashboardRangeLabel>(() => {
    const savedRange = window.localStorage.getItem(dashboardRangeStorageKey) as DashboardRangeLabel | null;
    return savedRange && dashboardRangeOptions.includes(savedRange) ? savedRange : "All Time";
  });

  const setSelectedRange = (range: DashboardRangeLabel) => {
    setSelectedRangeState(range);
    window.localStorage.setItem(dashboardRangeStorageKey, range);
  };

  const value = useMemo(
    () => ({
      selectedRange,
      selectedRangeParam: dashboardRangeParamByLabel[selectedRange],
      setSelectedRange,
    }),
    [selectedRange],
  );

  return <DashboardRangeContext.Provider value={value}>{children}</DashboardRangeContext.Provider>;
}

export function useDashboardRange() {
  const context = useContext(DashboardRangeContext);

  if (!context) {
    throw new Error("useDashboardRange must be used inside DashboardRangeProvider.");
  }

  return context;
}
