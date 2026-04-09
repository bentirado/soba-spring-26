import { StatCard } from "@/components/shared/StatCard";
import { Star, TrendingUp, Users, Timer } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const exhibitionPerformance = [
  { name: "Space Exploration", visitors: 2400, rating: 4.8, engagement: 92 },
  { name: "Ocean Life", visitors: 1890, rating: 4.6, engagement: 88 },
  { name: "Dinosaur Era", visitors: 2100, rating: 4.9, engagement: 95 },
  { name: "Human Body", visitors: 1650, rating: 4.5, engagement: 85 },
  { name: "Energy Lab", visitors: 1320, rating: 4.7, engagement: 89 },
  { name: "Robotics Workshop", visitors: 980, rating: 4.8, engagement: 91 },
];

const monthlyTrend = [
  { month: "Oct", space: 2100, ocean: 1650, dinosaur: 1890 },
  { month: "Nov", space: 2250, ocean: 1780, dinosaur: 1950 },
  { month: "Dec", space: 2420, ocean: 1920, dinosaur: 2150 },
  { month: "Jan", space: 2180, ocean: 1680, dinosaur: 1920 },
  { month: "Feb", space: 2350, ocean: 1850, dinosaur: 2050 },
  { month: "Mar", space: 2400, ocean: 1890, dinosaur: 2100 },
];

const engagementMetrics = [
  { metric: "Interactive Elements", value: 92 },
  { metric: "Time Spent", value: 88 },
  { metric: "Satisfaction", value: 95 },
  { metric: "Learning Value", value: 90 },
  { metric: "Recommendation", value: 93 },
];

const colors = ["#1f4f99", "#ff7a3d", "#2fb36f", "#60a5fa", "#fbbf24", "#34d399"];

const demographicData = [
  { name: "Children (5-12)", value: 35, color: "#2563eb" },
  { name: "Teens (13-17)", value: 18, color: "#60a5fa" },
  { name: "Adults (18-64)", value: 38, color: "#f97316" },
  { name: "Seniors (65+)", value: 9, color: "#16a34a" },
];

export function Exhibitions() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">
          Exhibition Analytics
        </h1>
        <p className="text-gray-500">
          Performance metrics and engagement data for all exhibitions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Exhibitions"
          value="12"
          change="2 new this month"
          icon={Star}
          iconColor="bg-[#1f4f99]"
        />
        <StatCard
          title="Avg. Visitors/Day"
          value="1,850"
          change="+12.5% this week"
          icon={Users}
          iconColor="bg-[#ff7a3d]"
          valueClassName="text-2xl"
        />
        <StatCard
          title="Avg. Rating"
          value="4.7/5"
          change="+0.2 improvement"
          icon={TrendingUp}
          iconColor="bg-[#2fb36f]"
        />
        <StatCard
          title="Avg. Duration"
          value="32 min"
          change="+5 min increase"
          icon={Timer}
          iconColor="bg-[#1f4f99]"
        />
      </div>

      {/* Performance + Monthly Trends side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Exhibition Performance */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="mb-4 font-semibold text-gray-900">
            Exhibition Performance
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={exhibitionPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="visitors" radius={[8, 8, 0, 0]}>
                {exhibitionPerformance.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Monthly Trends</h3>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="space"
                stroke="#1f4f99"
                strokeWidth={3}
                dot={{ fill: "#1f4f99", r: 4 }}
                name="Space Exploration"
              />
              <Line
                type="monotone"
                dataKey="ocean"
                stroke="#ff7a3d"
                strokeWidth={3}
                dot={{ fill: "#ff7a3d", r: 4 }}
                name="Ocean Life"
              />
              <Line
                type="monotone"
                dataKey="dinosaur"
                stroke="#2fb36f"
                strokeWidth={3}
                dot={{ fill: "#2fb36f", r: 4 }}
                name="Dinosaur Era"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="mb-4 font-semibold text-gray-900">
          Engagement Metrics
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={engagementMetrics}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              dataKey="value"
              stroke="#1f4f99"
              fill="#1f4f99"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Exhibitions + Visitor Demographics (moved from Overview) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Top Exhibitions</h3>
          <p className="mb-4 text-sm text-gray-500">Most visited this month</p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={exhibitionPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={140} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="visitors" radius={[0, 8, 8, 0]}>
                {exhibitionPerformance.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Visitor Demographics</h3>
          <p className="mb-4 text-sm text-gray-500">Current audience mix</p>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={demographicData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                dataKey="value"
              >
                {demographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}