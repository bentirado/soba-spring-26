import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BreakdownChartType = "pie" | "bar" | "horizontal";

type BreakdownDatum = {
  label: string;
  count: number;
};

type VolunteerBreakdownChartProps = {
  data: BreakdownDatum[];
  chartType: BreakdownChartType;
  sortMode?: "count_desc" | "preserve";
};

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

export default function VolunteerBreakdownChart({
  data,
  chartType,
  sortMode = "count_desc",
}: VolunteerBreakdownChartProps) {
  const sortedData =
    sortMode === "preserve"
      ? data
      : [...data].sort((left, right) => {
          if (right.count !== left.count) {
            return right.count - left.count;
          }

          return left.label.localeCompare(right.label);
        });

  return (
    <div className="mt-6 h-80">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "pie" ? (
          <PieChart>
            <Pie data={sortedData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${entry.label}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : chartType === "bar" ? (
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <BarChart data={sortedData} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={140} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
