import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Type for each point returned by the backend line chart endpoint.
type LastActivityPoint = {
  month: string;
  count: number;
};

// Allowed chart types for this component.
type LastActivityChartType = "line" | "bar" | "area";

// Props expected by this chart component.
type LastActivityChartProps = {
  data: LastActivityPoint[];
  chartType: LastActivityChartType;
};

// Reusable chart component for volunteer last-activity data.
export default function LastActivityChart({
  data,
  chartType,
}: LastActivityChartProps) {
  return (
    <div className="mt-6 h-80">
      {/* Responsive container makes the chart resize nicely */}
      <ResponsiveContainer width="100%" height="100%">
        <>
          {/* Render a line chart when the selected type is "line" */}
          {chartType === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          )}

          {/* Render a bar/column chart when the selected type is "bar" */}
          {chartType === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}

          {/* Render an area chart when the selected type is "area" */}
          {chartType === "area" && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                fill="#93c5fd"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </>
      </ResponsiveContainer>
    </div>
  );
}
