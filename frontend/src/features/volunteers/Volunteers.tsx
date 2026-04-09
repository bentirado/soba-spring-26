import { StatCard } from "../../components/shared/StatCard";
import { useState, useRef } from "react";
import { Users, Clock, CalendarDays, HeartHandshake, Download, ChevronDown } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const attendanceData = [
  { month: "Jan", recurring: 100, newVolunteers: 120 },
  { month: "Feb", recurring: 112, newVolunteers: 135 },
  { month: "Mar", recurring: 132, newVolunteers: 160 },
  { month: "Apr", recurring: 125, newVolunteers: 148 },
  { month: "May", recurring: 148, newVolunteers: 182 },
  { month: "Jun", recurring: 162, newVolunteers: 210 },
  { month: "Jul", recurring: 178, newVolunteers: 232 },
  { month: "Aug", recurring: 178, newVolunteers: 220 },
  { month: "Sep", recurring: 190, newVolunteers: 242 },
  { month: "Oct", recurring: 210, newVolunteers: 262 },
  { month: "Nov", recurring: 228, newVolunteers: 284 },
  { month: "Dec", recurring: 248, newVolunteers: 322 },
];

const ageDistributionData = [
  { group: "18-24", volunteers: 42, color: "#059669" },
  { group: "25-34", volunteers: 120, color: "#34d399" },
  { group: "35-44", volunteers: 84, color: "#a7f3d0" },
  { group: "45-54", volunteers: 54, color: "#f2c84b" },
  { group: "55+", volunteers: 36, color: "#f59e0b" },
];

const genderData = [
  { name: "Female", value: 48, color: "#059669" },
  { name: "Male", value: 37, color: "#34d399" },
  { name: "Non-binary", value: 15, color: "#a7f3d0" },
];

const engagementData = [
  { month: "Jan", currentYear: 120, previousYear: 95 },
  { month: "Feb", currentYear: 132, previousYear: 102 },
  { month: "Mar", currentYear: 160, previousYear: 118 },
  { month: "Apr", currentYear: 145, previousYear: 126 },
  { month: "May", currentYear: 182, previousYear: 140 },
  { month: "Jun", currentYear: 210, previousYear: 156 },
  { month: "Jul", currentYear: 228, previousYear: 172 },
  { month: "Aug", currentYear: 215, previousYear: 184 },
  { month: "Sep", currentYear: 240, previousYear: 192 },
  { month: "Oct", currentYear: 262, previousYear: 210 },
  { month: "Nov", currentYear: 288, previousYear: 232 },
  { month: "Dec", currentYear: 322, previousYear: 255 },
];

const weeklyActivityData = [
  { day: "Mon", volunteers: 22, hours: 140, participation: 72 },
  { day: "Tue", volunteers: 25, hours: 155, participation: 78 },
  { day: "Wed", volunteers: 29, hours: 168, participation: 85 },
  { day: "Thu", volunteers: 24, hours: 148, participation: 74 },
  { day: "Fri", volunteers: 31, hours: 176, participation: 88 },
  { day: "Sat", volunteers: 34, hours: 192, participation: 96 },
  { day: "Sun", volunteers: 32, hours: 184, participation: 93 },
];

const metricOptions = [
  { label: "Volunteers", value: "volunteers" },
  { label: "Hours", value: "hours" },
  { label: "Participation %", value: "participation" },
] as const;
const chartOptions = [
  { label: "Bar Chart", value: "bar" },
  { label: "Line Chart", value: "line" },
  { label: "Area Chart", value: "area" },
] as const;

type MetricValue = (typeof metricOptions)[number]["value"];
type ChartValue = (typeof chartOptions)[number]["value"];

// Hall of Fame data moved to the Recognition page

export function Volunteers() {
  const metricDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);

  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("participation");
  const [selectedChart, setSelectedChart] = useState<ChartValue>("bar");

  const selectedMetricLabel = metricOptions.find((option) => option.value === selectedMetric)?.label ?? "Participation %";
  const selectedChartLabel = chartOptions.find((option) => option.value === selectedChart)?.label ?? "Bar Chart";

  const metricColor = selectedMetric === "hours" ? "#f97316" : selectedMetric === "volunteers" ? "#2563eb" : "#059669";

  const renderWeeklyActivityChart = () => {
    if (selectedChart === "line") {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weeklyActivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={metricColor}
              strokeWidth={3}
              dot={{ fill: metricColor, r: 4 }}
              name={selectedMetricLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedChart === "area") {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={weeklyActivityData}>
            <defs>
              <linearGradient id="weeklyAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={metricColor} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={metricColor}
              fill="url(#weeklyAreaFill)"
              strokeWidth={2}
              name={selectedMetricLabel}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weeklyActivityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey={selectedMetric} fill={metricColor} radius={[8, 8, 0, 0]} name={selectedMetricLabel} />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  const handleExportClick = () => {
    console.log("Export data clicked");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Volunteers Directory & Trends</h1>
          <p className="text-sm text-gray-500">Analyze volunteer demographics, retention, and top contributors.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportClick}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f4f99] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#173d77]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Volunteers" value="342" change="+5.2% vs last month" changeType="positive" icon={Users} iconColor="bg-[#1f4f99]" />
        <StatCard title="Hours Logged" value="1,250" change="+8.2% vs last month" changeType="positive" icon={Clock} iconColor="bg-[#ff7a3d]" />
        <StatCard title="Active Events" value="12" change="-2.4% vs last month" changeType="negative" icon={CalendarDays} iconColor="bg-[#2fb36f]" />
        <StatCard
          title="Community Impact"
          value="3.2k"
          change="+12.3% people served"
          changeType="positive"
          icon={HeartHandshake}
          iconColor="bg-[#1f4f99]"
        />
      </div>

      {/* Attendance Breakdown - full width */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-semibold text-gray-900">Attendance Breakdown</h3>
        <p className="mb-4 text-sm text-gray-500">New vs recurrent volunteer attendance</p>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={attendanceData}>
            <defs>
              <linearGradient id="colorRecurringVolunteers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="colorNewVolunteersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="recurring"
              stroke="#059669"
              fill="url(#colorRecurringVolunteers)"
              strokeWidth={2}
              name="Recurrent Volunteers"
            />
            <Area
              type="monotone"
              dataKey="newVolunteers"
              stroke="#34d399"
              fill="url(#colorNewVolunteersFill)"
              strokeWidth={2}
              name="New Volunteers"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Age + Gender side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Age Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Age Distribution</h3>
          <p className="mb-4 text-sm text-gray-500">Active volunteers by age group</p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="group" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                }}
              />
              <Bar dataKey="volunteers" radius={[8, 8, 0, 0]}>
                {ageDistributionData.map((entry, index) => (
                  <Cell key={`age-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Gender Breakdown</h3>
          <p className="mb-4 text-sm text-gray-500">Self-reported gender identity</p>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={70} outerRadius={112} paddingAngle={4} dataKey="value">
                {genderData.map((entry, index) => (
                  <Cell key={`gender-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volunteer Engagement Trends + Weekly Activity (moved from Overview) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Volunteer Engagement Trends */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Volunteer Engagement Trends</h3>
          <p className="mb-4 text-sm text-gray-500">Active volunteers per month (YoY Comparison)</p>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="currentYear" stroke="#059669" strokeWidth={3} dot={{ fill: "#059669", r: 4 }} name="Current Year" />
              <Line
                type="monotone"
                dataKey="previousYear"
                stroke="#94a3b8"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                dot={{ fill: "#94a3b8", r: 3 }}
                name="Previous Year"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity Analysis */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-900">Weekly Activity Analysis</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" ref={metricDropdownRef}>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Metric:</span>
                  <button
                    onClick={() => setMetricOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <span>{selectedMetricLabel}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${metricOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {metricOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {metricOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedMetric(option.value);
                          setMetricOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${
                          selectedMetric === option.value ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={chartDropdownRef}>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Chart:</span>
                  <button
                    onClick={() => setChartOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <span>{selectedChartLabel}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${chartOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {chartOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {chartOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedChart(option.value);
                          setChartOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${
                          selectedChart === option.value ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {renderWeeklyActivityChart()}
        </div>
      </div>
    </div>
  );
}
