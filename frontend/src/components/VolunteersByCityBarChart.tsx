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
  const sortedData = [...data].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.city.localeCompare(right.city);
  });

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
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="mt-6 h-80">
      {/* Responsive container makes the chart resize nicely */}
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "vertical" ? (
          <BarChart data={sortedData}>
            {/* Background grid lines */}
            <CartesianGrid strokeDasharray="3 3" />

            {/* X-axis uses the city field */}
            <XAxis dataKey="city" />

            {/* Y-axis uses whole numbers only */}
            <YAxis allowDecimals={false} />

            {/* Tooltip appears on hover */}
            <Tooltip />

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
            <YAxis type="category" dataKey="city" width={100} />

            {/* Tooltip appears on hover */}
            <Tooltip />

            {/* Main horizontal bars showing volunteer counts by city */}
            <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
