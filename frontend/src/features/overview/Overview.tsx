import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { StatCard } from "@/components/shared/StatCard";
import {
  Users,
  DollarSign,
  Star,
  TrendingUp,
  ArrowUpRight,
  Upload,
  FileText,
  Sparkles,
  ChevronDown,
  UserCheck,
  Clock3,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const visitorData = [
  { month: "Oct", visitors: 4200, revenue: 42000 },
  { month: "Nov", visitors: 4800, revenue: 48000 },
  { month: "Dec", visitors: 5500, revenue: 58000 },
  { month: "Jan", visitors: 3900, revenue: 39000 },
  { month: "Feb", visitors: 5200, revenue: 54000 },
  { month: "Mar", visitors: 6100, revenue: 65000 },
];

const exhibitionData = [
  { name: "Space Exploration", visitors: 2400 },
  { name: "Ocean Life", visitors: 1890 },
  { name: "Dinosaur Era", visitors: 2100 },
  { name: "Human Body", visitors: 1650 },
  { name: "Energy Lab", visitors: 1320 },
];

const demographicData = [
  { name: "Children (5-12)", value: 35, color: "#2563eb" },
  { name: "Teens (13-17)", value: 18, color: "#60a5fa" },
  { name: "Adults (18-64)", value: 38, color: "#f97316" },
  { name: "Seniors (65+)", value: 9, color: "#16a34a" },
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

const rangeOptions = ["Last 30 Days", "This Quarter", "This Year", "All Time"];
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

export function Overview() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dataActionsRef = useRef<HTMLDivElement | null>(null);
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);
  const metricDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [dataActionsOpen, setDataActionsOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const [selectedRange, setSelectedRange] = useState("Last 30 Days");
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("participation");
  const [selectedChart, setSelectedChart] = useState<ChartValue>("bar");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setDataActionsOpen(false);
  };

  const handleExportClick = () => {
    console.log("Export report clicked");
    setDataActionsOpen(false);
  };

  const handleGenerateReportClick = () => {
    console.log("Generate report clicked");
  };

  const handleAIAssistantClick = () => {
    console.log("AI Assistant clicked");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    console.log("Selected file:", file.name);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dataActionsRef.current && !dataActionsRef.current.contains(target)) {
        setDataActionsOpen(false);
      }
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(target)) {
        setRangeOpen(false);
      }
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(target)) {
        setMetricOpen(false);
      }
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(target)) {
        setChartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedMetricLabel =
    metricOptions.find((option) => option.value === selectedMetric)?.label ?? "Participation %";

  const selectedChartLabel =
    chartOptions.find((option) => option.value === selectedChart)?.label ?? "Bar Chart";

  const metricColor =
    selectedMetric === "hours"
      ? "#f97316"
      : selectedMetric === "volunteers"
      ? "#2563eb"
      : "#059669";

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
          <Bar
            dataKey={selectedMetric}
            fill={metricColor}
            radius={[8, 8, 0, 0]}
            name={selectedMetricLabel}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500">
            Key metrics and performance indicators for volunteer engagement
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          {/* First row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="relative" ref={rangeDropdownRef}>
              <button
                onClick={() => setRangeOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <span>{selectedRange}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${rangeOpen ? "rotate-180" : ""}`}
                />
              </button>

              {rangeOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {rangeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRange(option);
                        setRangeOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition ${
                        selectedRange === option
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Report */}
            <button
              onClick={handleGenerateReportClick}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>

            {/* Data Actions */}
            <div className="relative" ref={dataActionsRef}>
              <button
                onClick={() => setDataActionsOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <span>Data Actions</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    dataActionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dataActionsOpen && (
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={handleUploadClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    Upload Data
                  </button>
                  <button
                    onClick={handleExportClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    Export Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Second row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAIAssistantClick}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </button>
          </div>

          {selectedFileName && (
            <p className="text-sm text-gray-500">
              Selected file: {selectedFileName}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Volunteers"
          value="58"
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconColor="bg-blue-600"
        />
        <StatCard
          title="Hours Logged"
          value="425"
          change="+25% increase"
          changeType="positive"
          icon={Clock3}
          iconColor="bg-orange-500"
        />
        <StatCard
          title="New Volunteers"
          value="8"
          change="This month"
          changeType="positive"
          icon={UserPlus}
          iconColor="bg-green-600"
        />
        <StatCard
          title="Retention Rate"
          value="87%"
          change="+5% improvement"
          changeType="positive"
          icon={TrendingUp}
          iconColor="bg-blue-600"
        />
      </div>

      {/* Top row: requested graphs */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Volunteer Engagement Trends */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">
            Volunteer Engagement Trends
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Active volunteers per month (YoY Comparison)
          </p>

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
              <Line
                type="monotone"
                dataKey="currentYear"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: "#059669", r: 4 }}
                name="Current Year"
              />
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
              <h3 className="mb-1 text-xl font-semibold text-gray-900">
                Weekly Activity Analysis
              </h3>
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
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        metricOpen ? "rotate-180" : ""
                      }`}
                    />
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
                          selectedMetric === option.value
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
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
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        chartOpen ? "rotate-180" : ""
                      }`}
                    />
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
                          selectedChart === option.value
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
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

      {/* Existing rest of page kept */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold">Top Exhibitions</h3>
          <p className="mb-4 text-sm text-gray-500">Most visited this month</p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={exhibitionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="visitors"
                fill="#16a34a"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold">Visitor Demographics</h3>
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

      {/* Bottom insight cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Most Active Day</p>
          <p className="text-sm text-gray-500">
            Saturdays see the highest volunteer turnout
          </p>
          <p className="mt-4 text-2xl font-semibold text-blue-600">35 volunteers</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Clock3 className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">
            Avg. Hours per Volunteer
          </p>
          <p className="text-sm text-gray-500">Average monthly contribution</p>
          <p className="mt-4 text-2xl font-semibold text-orange-500">7.3 hrs</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Growth This Year</p>
          <p className="text-sm text-gray-500">
            Year-over-year volunteer increase
          </p>
          <p className="mt-4 text-2xl font-semibold text-green-600">+28%</p>
        </div>
      </div>
    </div>
  );
}