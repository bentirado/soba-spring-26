import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Chatbot } from "@/components/Chatbot";
import LastActivityChart from "@/components/LastActivityChart";
import DashboardStatCard from "@/components/StatCard";
import VolunteersByCityBarChart from "@/components/VolunteersByCityBarChart";
import VolunteersByGenderPieChart from "@/components/VolunteersByGenderPieChart";
import * as XLSX from "xlsx";
import { StatCard } from "@/components/shared/StatCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TrendingUp, FileText, ChevronDown, UserCheck, Clock3, UserPlus } from "lucide-react";
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
type SpreadsheetRow = Record<string, unknown>;

const parseSpreadsheetFile = async (file: File): Promise<SpreadsheetRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];

  return XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, {
    defval: "",
    raw: false,
  });
};

type OverviewData = {
  total_volunteers: number;
  hours_logged: number;
  average_age: number;
  cities_represented: number;
};

type LastActivityPoint = {
  month: string;
  count: number;
};

type GenderBreakdownPoint = {
  gender: string;
  count: number;
};

type CityBreakdownPoint = {
  city: string;
  count: number;
};

export function Overview() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dataActionsRef = useRef<HTMLDivElement | null>(null);
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);
  const metricDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [pendingUploadRows, setPendingUploadRows] = useState<SpreadsheetRow[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dataActionsOpen, setDataActionsOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const [selectedRange, setSelectedRange] = useState("Last 30 Days");
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("participation");
  const [selectedChart, setSelectedChart] = useState<ChartValue>("bar");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [lastActivityData, setLastActivityData] = useState<LastActivityPoint[]>([]);
  const [genderData, setGenderData] = useState<GenderBreakdownPoint[]>([]);
  const [cityData, setCityData] = useState<CityBreakdownPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastActivityChartType, setLastActivityChartType] = useState<"line" | "bar" | "area">("line");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [genderChartType, setGenderChartType] = useState<"pie" | "bar" | "horizontal">("pie");
  const [genderStartMonth, setGenderStartMonth] = useState("");
  const [genderEndMonth, setGenderEndMonth] = useState("");
  const [cityChartType, setCityChartType] = useState<"vertical" | "horizontal" | "pie">("vertical");
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setDataActionsOpen(false);
  };

  const resetPendingUpload = () => {
    setSelectedFileName("");
    setPendingUploadRows([]);
    setUploadErrorMessage("");
    setIsUploadDialogOpen(false);
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsedRows = await parseSpreadsheetFile(file);

      setSelectedFileName(file.name);
      setPendingUploadRows(parsedRows);
      setUploadErrorMessage("");
      setIsUploadDialogOpen(true);
    } catch (error) {
      setSelectedFileName(file.name);
      setPendingUploadRows([]);
      setIsUploadDialogOpen(true);
      console.error("Failed to parse uploaded spreadsheet:", error);
      setUploadErrorMessage("We couldn't read that spreadsheet. Please try another file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleUploadSave = async () => {
    try {
      setIsUploading(true);
      setUploadErrorMessage("");

      // Convert the parsed spreadsheet rows into the field names
      // expected by the backend upload endpoint.
      const normalizedRows = pendingUploadRows.map((row) => ({
        City: String(row["City"] ?? ""),
        State: String(row["State"] ?? ""),
        Zip: String(row["Zip"] ?? ""),
        Age: String(row["Age"] ?? ""),
        Gender: String(row["Gender"] ?? ""),
        Ethnicity: String(row["Ethnicity"] ?? ""),
        Dietary_Restrictions: String(row["Dietary Restrictions"] ?? ""),
        Hispanic_Latino_Or_Spanish: String(row["Hispanic, Latino Or Spanish"] ?? ""),
        Life_Hours: String(row["Life Hours"] ?? ""),
        Date_Of_Last_Activity: String(row["Date Of Last Activity"] ?? ""),
        Age_1: String(row["Age_1"] ?? row["Age.1"] ?? ""),
      }));

      const response = await fetch(`${apiBaseUrl}/api/volunteers/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: normalizedRows,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload volunteer data.");
      }

      const result = await response.json();
      console.log("Upload result:", result);

      resetPendingUpload();
      setDashboardRefreshToken((currentValue) => currentValue + 1);
    } catch (error) {
      console.error("Volunteer upload failed:", error);
      setUploadErrorMessage("Upload failed. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadReplace = () => {
    fileInputRef.current?.click();
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

  const filteredLastActivityData = lastActivityData.filter((item) => {
    const isAfterStart = !startMonth || item.month >= startMonth;
    const isBeforeEnd = !endMonth || item.month <= endMonth;
    return isAfterStart && isBeforeEnd;
  });

  const filteredGenderData = genderData;
  const businessImpact = overview ? overview.hours_logged * 30 : null;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const overviewResponse = await fetch(`${apiBaseUrl}/api/overview`);

        if (!overviewResponse.ok) {
          throw new Error("Failed to fetch overview data");
        }

        const overviewJson: OverviewData = await overviewResponse.json();
        setOverview(overviewJson);

        const lineChartResponse = await fetch(`${apiBaseUrl}/api/charts/last-activity-by-month`);

        if (!lineChartResponse.ok) {
          throw new Error("Failed to fetch line chart data");
        }

        const lineChartData: LastActivityPoint[] = await lineChartResponse.json();
        setLastActivityData(lineChartData);

        const genderChartResponse = await fetch(`${apiBaseUrl}/api/charts/volunteers-by-gender?start=${genderStartMonth}&end=${genderEndMonth}`);

        if (!genderChartResponse.ok) {
          throw new Error("Failed to fetch gender chart data");
        }

        const genderChartData: GenderBreakdownPoint[] = await genderChartResponse.json();
        setGenderData(genderChartData);

        const cityChartResponse = await fetch(`${apiBaseUrl}/api/charts/volunteers-by-city`);

        if (!cityChartResponse.ok) {
          throw new Error("Failed to fetch city chart data");
        }

        const cityChartData: CityBreakdownPoint[] = await cityChartResponse.json();
        setCityData(cityChartData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [apiBaseUrl, genderStartMonth, genderEndMonth, dashboardRefreshToken]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Key metrics and performance indicators for volunteer engagement</p>
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
                <ChevronDown className={`h-4 w-4 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
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
                        selectedRange === option ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
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
                <ChevronDown className={`h-4 w-4 transition-transform ${dataActionsOpen ? "rotate-180" : ""}`} />
              </button>

              {dataActionsOpen && (
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button onClick={handleUploadClick} className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                    Upload Data
                  </button>
                  <button onClick={handleExportClick} className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                    Export Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedFileName && <p className="text-sm text-gray-500">Selected file: {selectedFileName}</p>}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />

      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsUploadDialogOpen(true);
            return;
          }

          resetPendingUpload();
        }}
      >
        <DialogContent className="max-w-3xl border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle>Review Uploaded Data</DialogTitle>
            <DialogDescription>
              {uploadErrorMessage ? uploadErrorMessage : "Choose what you'd like to do with the selected spreadsheet."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <p>
                <span className="font-medium text-gray-900">File:</span> {selectedFileName || "No file selected"}
              </p>
              {!uploadErrorMessage && (
                <p>
                  <span className="font-medium text-gray-900">Rows parsed:</span> {pendingUploadRows.length}
                </p>
              )}
            </div>

            {!uploadErrorMessage && pendingUploadRows.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                No rows were found in the selected sheet.
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={resetPendingUpload}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadReplace}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              Upload New Data
            </button>
            <button
              type="button"
              onClick={handleUploadSave}
              disabled={Boolean(uploadErrorMessage) || isUploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isUploading ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Volunteers" value="58" change="+12% from last month" changeType="positive" icon={Users} iconColor="bg-blue-600" />
        <StatCard title="Hours Logged" value="425" change="+25% increase" changeType="positive" icon={Clock3} iconColor="bg-orange-500" />
        <StatCard title="New Volunteers" value="8" change="This month" changeType="positive" icon={UserPlus} iconColor="bg-green-600" />
        <StatCard title="Retention Rate" value="87%" change="+5% improvement" changeType="positive" icon={TrendingUp} iconColor="bg-blue-600" />
      </div>

      {/* API-backed dashboard content */}
      <div className="space-y-6">
        {loading && <p className="text-sm text-slate-600">Loading dashboard...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardStatCard title="Total Volunteers" value={overview?.total_volunteers ?? "--"} />
          <DashboardStatCard title="Hours Logged" value={overview?.hours_logged ?? "--"} />
          <DashboardStatCard title="Average Age" value={overview?.average_age ?? "--"} />
          <DashboardStatCard title="Cities Represented" value={overview?.cities_represented ?? "--"} />
          <DashboardStatCard title="Business Impact" value={businessImpact !== null ? `$${businessImpact.toLocaleString()}` : "--"} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Last Activity by Month</h2>
            <p className="mt-1 text-sm text-slate-500">Number of volunteers grouped by their most recent recorded activity month.</p>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                <select
                  value={lastActivityChartType}
                  onChange={(event) => setLastActivityChartType(event.target.value as "line" | "bar" | "area")}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar / Column Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Start Month</label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={(event) => setStartMonth(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">End Month</label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(event) => setEndMonth(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </div>
            </div>

            <LastActivityChart data={filteredLastActivityData} chartType={lastActivityChartType} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Volunteers by City</h2>
            <p className="mt-1 text-sm text-slate-500">Number of volunteers grouped by city from the mock dataset.</p>

            <div className="mt-4 flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
              <select
                value={cityChartType}
                onChange={(event) => setCityChartType(event.target.value as "vertical" | "horizontal" | "pie")}
                className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="vertical">Column Chart</option>
                <option value="horizontal">Horizontal Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <VolunteersByCityBarChart data={cityData} chartType={cityChartType} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Volunteers by Gender</h2>
            <p className="mt-1 text-sm text-slate-500">Gender breakdown of volunteers from the mock dataset.</p>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                <select
                  value={genderChartType}
                  onChange={(event) => setGenderChartType(event.target.value as "pie" | "bar" | "horizontal")}
                  className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="pie">Pie Chart</option>
                  <option value="bar">Bar / Column Chart</option>
                  <option value="horizontal">Horizontal Bar Chart</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Start Month</label>
                <input
                  type="month"
                  value={genderStartMonth}
                  onChange={(event) => setGenderStartMonth(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">End Month</label>
                <input
                  type="month"
                  value={genderEndMonth}
                  onChange={(event) => setGenderEndMonth(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </div>
            </div>

            <VolunteersByGenderPieChart data={filteredGenderData} chartType={genderChartType} />
          </div>
        </div>
      </div>

      {/* Top row: requested graphs */}
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

      {/* Existing rest of page kept */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold">Top Exhibitions</h3>
          <p className="mb-4 text-sm text-gray-500">Most visited this month</p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={exhibitionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="visitors" fill="#16a34a" radius={[0, 8, 8, 0]} />
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
          <p className="text-sm text-gray-500">Saturdays see the highest volunteer turnout</p>
          <p className="mt-4 text-2xl font-semibold text-blue-600">35 volunteers</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Clock3 className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Avg. Hours per Volunteer</p>
          <p className="text-sm text-gray-500">Average monthly contribution</p>
          <p className="mt-4 text-2xl font-semibold text-orange-500">7.3 hrs</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Growth This Year</p>
          <p className="text-sm text-gray-500">Year-over-year volunteer increase</p>
          <p className="mt-4 text-2xl font-semibold text-green-600">+28%</p>
        </div>
      </div>

      <Chatbot />
    </div>
  );
}
