import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Type for each gender breakdown item returned by the backend.
type GenderBreakdownPoint = {
  gender: string;
  count: number;
};

// Allowed chart types for the gender breakdown chart.
type GenderChartType = "pie" | "bar" | "horizontal";

// Props expected by this chart component.
type VolunteersByGenderPieChartProps = {
  data: GenderBreakdownPoint[];
  chartType: GenderChartType;
};

// Colors for the pie chart slices.
// Later we can adjust these if you want a different palette.
const COLORS = ["#2563eb", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"];

// Chart component for volunteer counts grouped by gender.
export default function VolunteersByGenderPieChart({ data, chartType }: VolunteersByGenderPieChartProps) {
  return (
    <div className="mt-6 h-80">
      {/* Responsive container makes the chart resize nicely */}
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${entry.gender}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : chartType === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="gender" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="gender" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
