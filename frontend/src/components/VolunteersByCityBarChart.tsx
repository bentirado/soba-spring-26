import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Type for each city breakdown item returned by the backend.
type CityBreakdownPoint = {
  city: string;
  count: number;
};

// Allowed chart types for the city breakdown chart.
type CityChartType = "vertical" | "horizontal" | "pie";

// Props expected by this chart component.
type VolunteersByCityBarChartProps = {
  data: CityBreakdownPoint[];
  chartType: CityChartType;
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function VolunteersByCityBarChart({ data, chartType }: VolunteersByCityBarChartProps) {
  const verticalChartScrollRef = useRef<HTMLDivElement | null>(null);

  const tooltipFormatter = (value: number) => [
    `${value.toLocaleString()} volunteer${value === 1 ? "" : "s"}`,
    "Volunteers",
  ];

  const sortedData = [...data].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.city.localeCompare(right.city);
  });
  const verticalChartWidth = Math.max(720, sortedData.length * 92);
  const horizontalChartHeight = Math.max(260, sortedData.length * 28);
  const canScrollColumnChart = chartType === "vertical" && verticalChartWidth > 720;

  const scrollColumnChart = (direction: "left" | "right") => {
    verticalChartScrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  if (chartType === "pie") {
    return (
      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sortedData} dataKey="count" nameKey="city" cx="50%" cy="50%" outerRadius={100} label>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`relative mt-6 ${canScrollColumnChart ? "px-12" : ""}`}>
      <div
        ref={chartType === "vertical" ? verticalChartScrollRef : null}
        className={chartType === "vertical" ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""}
      >
        <div
          className={chartType === "vertical" ? "h-[390px]" : ""}
          style={
            chartType === "vertical"
              ? { minWidth: `${verticalChartWidth}px` }
              : { height: `${horizontalChartHeight}px` }
          }
        >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "vertical" ? (
          <BarChart data={sortedData} margin={{ top: 8, right: 16, left: 8, bottom: 58 }}>
            {/* Background grid lines */}
            <CartesianGrid strokeDasharray="3 3" />

            {/* X-axis uses the city field */}
            <XAxis
              dataKey="city"
              angle={-35}
              height={64}
              interval={0}
              textAnchor="end"
              tick={{ fontSize: 12 }}
            />

            {/* Y-axis uses whole numbers only */}
            <YAxis allowDecimals={false} />

            {/* Tooltip appears on hover */}
            <Tooltip formatter={tooltipFormatter} />

            {/* Main bars showing volunteer counts by city */}
            <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <BarChart data={sortedData} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
            {/* Background grid lines */}
            <CartesianGrid strokeDasharray="3 3" />

            {/* X-axis becomes the numeric axis in horizontal mode */}
            <XAxis type="number" allowDecimals={false} />

            {/* Y-axis uses the city field in horizontal mode */}
            <YAxis type="category" dataKey="city" interval={0} width={132} tick={{ fontSize: 12 }} />

            {/* Tooltip appears on hover */}
            <Tooltip formatter={tooltipFormatter} />

            {/* Main horizontal bars showing volunteer counts by city */}
            <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
          </BarChart>
        )}
        </ResponsiveContainer>
        </div>
      </div>

      {canScrollColumnChart && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <button
            type="button"
            onClick={() => scrollColumnChart("left")}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Scroll city chart left"
            title="Scroll city chart left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollColumnChart("right")}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Scroll city chart right"
            title="Scroll city chart right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
