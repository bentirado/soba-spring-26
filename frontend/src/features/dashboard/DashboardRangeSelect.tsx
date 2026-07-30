import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { dashboardRangeOptions, useDashboardRange } from "@/features/dashboard/DashboardRangeProvider";

export function DashboardRangeSelect() {
  const { selectedRange, setSelectedRange } = useDashboardRange();
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(target)) {
        setRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={rangeDropdownRef}>
      <button
        type="button"
        onClick={() => setRangeOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <span>{selectedRange}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
      </button>

      {rangeOpen && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {dashboardRangeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSelectedRange(option);
                setRangeOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition ${
                selectedRange === option ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
