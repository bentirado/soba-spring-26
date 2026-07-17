import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  Clock3,
  Download,
  FileUp,
  Search,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch, requireOk } from "@/lib/api";

type Volunteer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  age: number | null;
  age_group: string | null;
  gender: string | null;
  ethnicity: string | null;
  hispanic_latino: string | null;
  dietary_restrictions: string;
  is_active: boolean;
  joined_date: string | null;
  last_activity: string | null;
  life_hours: number | null;
};

type SpreadsheetRow = Record<string, unknown>;

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ageColors = ["#059669", "#34d399", "#a7f3d0", "#f2c84b", "#f59e0b", "#2563eb", "#7c3aed"];
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
type SortValue =
  | "name-asc"
  | "city-asc"
  | "age-asc"
  | "age-desc"
  | "hours-desc"
  | "hours-asc"
  | "last-activity-desc"
  | "last-activity-asc";
const volunteersPerPage = 25;

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

function normalizeSpreadsheetRows(rows: SpreadsheetRow[]) {
  return rows.map((row) => ({
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
}

function getMonthIndex(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getMonth();
}

function getWeekdayIndex(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getDay();
}

function getAgeGroup(volunteer: Volunteer) {
  if (volunteer.age_group) return volunteer.age_group;
  if (volunteer.age == null) return "Unknown";
  if (volunteer.age < 18) return "Under 18";
  if (volunteer.age <= 24) return "18-24";
  if (volunteer.age <= 34) return "25-34";
  if (volunteer.age <= 44) return "35-44";
  if (volunteer.age <= 54) return "45-54";
  return "55+";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function downloadCsv(volunteers: Volunteer[]) {
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "City",
    "State",
    "Age",
    "Gender",
    "Life Hours",
    "Last Activity",
    "Active",
  ];
  const rows = volunteers.map((volunteer) => [
    volunteer.first_name,
    volunteer.last_name,
    volunteer.email ?? "",
    volunteer.city ?? "",
    volunteer.state,
    volunteer.age?.toString() ?? "",
    volunteer.gender ?? "",
    volunteer.life_hours?.toString() ?? "",
    volunteer.last_activity ?? "",
    volunteer.is_active ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "volunteers.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function Volunteers() {
  const metricDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<SortValue>("hours-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("volunteers");
  const [selectedChart, setSelectedChart] = useState<ChartValue>("bar");
  const [importUploading, setImportUploading] = useState(false);
  const [importError, setImportError] = useState("");
  const [selectedImportFileName, setSelectedImportFileName] = useState("");

  async function fetchVolunteers() {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/api/volunteers");
      await requireOk(response, "Failed to load volunteers.");
      setVolunteers((await response.json()) as Volunteer[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load volunteers: ${err.message}`
          : "Could not load volunteers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return volunteers.filter((volunteer) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && volunteer.is_active) ||
        (statusFilter === "inactive" && !volunteer.is_active);
      const searchableText = [
        volunteer.first_name,
        volunteer.last_name,
        volunteer.email,
        volunteer.city,
        volunteer.state,
        volunteer.gender,
        volunteer.ethnicity,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [searchQuery, statusFilter, volunteers]);

  const sortedVolunteers = useMemo(() => {
    const sorted = [...filteredVolunteers];

    sorted.sort((a, b) => {
      if (sortBy === "name-asc") {
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      }
      if (sortBy === "city-asc") {
        return (a.city ?? "").localeCompare(b.city ?? "");
      }
      if (sortBy === "age-asc") {
        return (a.age ?? Number.MAX_SAFE_INTEGER) - (b.age ?? Number.MAX_SAFE_INTEGER);
      }
      if (sortBy === "age-desc") {
        return (b.age ?? -1) - (a.age ?? -1);
      }
      if (sortBy === "hours-asc") {
        return (a.life_hours ?? 0) - (b.life_hours ?? 0);
      }
      if (sortBy === "last-activity-asc") {
        return (a.last_activity ?? "").localeCompare(b.last_activity ?? "");
      }
      if (sortBy === "last-activity-desc") {
        return (b.last_activity ?? "").localeCompare(a.last_activity ?? "");
      }
      return (b.life_hours ?? 0) - (a.life_hours ?? 0);
    });

    return sorted;
  }, [filteredVolunteers, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedVolunteers.length / volunteersPerPage));
  const pageStartIndex = (currentPage - 1) * volunteersPerPage;
  const paginatedVolunteers = sortedVolunteers.slice(pageStartIndex, pageStartIndex + volunteersPerPage);
  const pageRangeStart = sortedVolunteers.length === 0 ? 0 : pageStartIndex + 1;
  const pageRangeEnd = Math.min(pageStartIndex + volunteersPerPage, sortedVolunteers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const totalVolunteers = volunteers.length;
  const activeVolunteers = volunteers.filter((volunteer) => volunteer.is_active).length;
  const totalHours = volunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);
  const averageHours = totalVolunteers ? totalHours / totalVolunteers : 0;

  const weeklyActivityData = useMemo(() => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = weekdays.map((day) => ({ day, volunteers: 0, hours: 0, participation: 0 }));
    volunteers.forEach((volunteer) => {
      const dayIndex = getWeekdayIndex(volunteer.last_activity);
      if (dayIndex == null) return;
      buckets[dayIndex].volunteers += 1;
      buckets[dayIndex].hours += volunteer.life_hours ?? 0;
    });
    return buckets.map((bucket) => ({
      ...bucket,
      hours: Number(bucket.hours.toFixed(1)),
      participation: totalVolunteers ? Math.round((bucket.volunteers / totalVolunteers) * 100) : 0,
    }));
  }, [totalVolunteers, volunteers]);

  const mostActiveDay = weeklyActivityData.reduce(
    (current, next) => (next.volunteers > current.volunteers ? next : current),
    weeklyActivityData[0],
  );

  const joinedByMonthData = useMemo(() => {
    const buckets = monthLabels.map((month) => ({ month, active: 0, inactive: 0 }));
    volunteers.forEach((volunteer) => {
      const monthIndex = getMonthIndex(volunteer.joined_date);
      if (monthIndex == null) return;
      if (volunteer.is_active) buckets[monthIndex].active += 1;
      else buckets[monthIndex].inactive += 1;
    });
    return buckets;
  }, [volunteers]);

  const engagementData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const buckets = monthLabels.map((month) => ({ month, currentYear: 0, previousYear: 0 }));
    volunteers.forEach((volunteer) => {
      if (!volunteer.joined_date) return;
      const joinedDate = new Date(`${volunteer.joined_date}T00:00:00`);
      if (Number.isNaN(joinedDate.getTime())) return;
      const monthIndex = joinedDate.getMonth();
      if (joinedDate.getFullYear() === currentYear) buckets[monthIndex].currentYear += 1;
      if (joinedDate.getFullYear() === previousYear) buckets[monthIndex].previousYear += 1;
    });
    return buckets;
  }, [volunteers]);

  const currentYearTotal = engagementData.reduce((sum, month) => sum + month.currentYear, 0);
  const previousYearTotal = engagementData.reduce((sum, month) => sum + month.previousYear, 0);
  const growthPercent = previousYearTotal
    ? Math.round(((currentYearTotal - previousYearTotal) / previousYearTotal) * 100)
    : currentYearTotal > 0
      ? 100
      : 0;

  const ageDistributionData = useMemo(() => {
    const counts = new Map<string, number>();
    volunteers.forEach((volunteer) => {
      const group = getAgeGroup(volunteer);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([group, count], index) => ({
      group,
      volunteers: count,
      color: ageColors[index % ageColors.length],
    }));
  }, [volunteers]);

  const selectedMetricLabel = metricOptions.find((option) => option.value === selectedMetric)?.label ?? "Volunteers";
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
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
            <Legend />
            <Line type="monotone" dataKey={selectedMetric} stroke={metricColor} strokeWidth={3} dot={{ fill: metricColor, r: 4 }} name={selectedMetricLabel} />
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
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
            <Legend />
            <Area type="monotone" dataKey={selectedMetric} stroke={metricColor} fill="url(#weeklyAreaFill)" strokeWidth={2} name={selectedMetricLabel} />
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
          <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
          <Legend />
          <Bar dataKey={selectedMetric} fill={metricColor} radius={[8, 8, 0, 0]} name={selectedMetricLabel} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const handleImportUploadClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportUploading(true);
      setImportError("");
      setSelectedImportFileName(file.name);
      const parsedRows = await parseSpreadsheetFile(file);

      if (parsedRows.length === 0) {
        setImportError("No rows were found in the selected spreadsheet.");
        return;
      }

      const response = await apiFetch("/api/volunteers/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          rows: normalizeSpreadsheetRows(parsedRows),
        }),
      });
      await requireOk(response, "Failed to replace analytics dataset.");
      await fetchVolunteers();
    } catch (err) {
      setImportError(
        err instanceof Error
          ? `Could not replace analytics dataset: ${err.message}`
          : "Could not replace analytics dataset.",
      );
    } finally {
      setImportUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Volunteers Directory & Trends</h1>
          <p className="text-sm text-gray-500">Analyze volunteer demographics, activity, and top contributors.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImportUploadClick}
            disabled={importUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileUp className="h-4 w-4" />
            {importUploading ? "Replacing..." : "Replace Dataset"}
          </button>
          <button
            onClick={() => downloadCsv(filteredVolunteers)}
            disabled={filteredVolunteers.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <input
        ref={importFileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {importError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {importError}
        </div>
      )}

      {selectedImportFileName && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Active dataset replaced from {selectedImportFileName}. Dashboard analytics now reflect the latest upload.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Active Volunteers</p>
          <p className="text-sm text-gray-500">{totalVolunteers} total records</p>
          <p className="mt-4 text-2xl font-semibold text-blue-600">{loading ? "--" : activeVolunteers}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Clock3 className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Avg. Hours per Volunteer</p>
          <p className="text-sm text-gray-500">Based on lifetime hours</p>
          <p className="mt-4 text-2xl font-semibold text-orange-500">{loading ? "--" : `${averageHours.toFixed(1)} hrs`}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Growth This Year</p>
          <p className="text-sm text-gray-500">Compared with prior-year joins</p>
          <p className="mt-4 text-2xl font-semibold text-green-600">{loading ? "--" : `${growthPercent >= 0 ? "+" : ""}${growthPercent}%`}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Volunteer Records</h2>
            <p className="text-sm text-gray-500">Search and filter rows from the active uploaded spreadsheet.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search volunteers"
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortValue)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="hours-desc">Sort: Hours high to low</option>
              <option value="hours-asc">Sort: Hours low to high</option>
              <option value="last-activity-desc">Sort: Recent activity first</option>
              <option value="last-activity-asc">Sort: Oldest activity first</option>
              <option value="age-asc">Sort: Age low to high</option>
              <option value="age-desc">Sort: Age high to low</option>
              <option value="city-asc">Sort: City A-Z</option>
              <option value="name-asc">Sort: Name A-Z</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                      Loading volunteers...
                    </td>
                  </tr>
                ) : filteredVolunteers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                      No uploaded spreadsheet rows match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedVolunteers.map((volunteer) => (
                    <tr key={volunteer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {volunteer.first_name} {volunteer.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{volunteer.email || "No email"}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {[volunteer.city, volunteer.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{volunteer.age ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{volunteer.gender || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{(volunteer.life_hours ?? 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(volunteer.last_activity)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${volunteer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {volunteer.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing {pageRangeStart}-{pageRangeEnd} of {filteredVolunteers.length} matching records.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, visiblePages) => {
                const previousPage = visiblePages[index - 1];
                const showGap = previousPage != null && page - previousPage > 1;

                return (
                  <span key={page} className="flex items-center gap-2">
                    {showGap && <span className="text-sm text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-9 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        currentPage === page
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-semibold text-gray-900">Volunteer Joins By Month</h3>
        <p className="mb-4 text-sm text-gray-500">Active and inactive volunteer records grouped by joined month.</p>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={joinedByMonthData}>
            <defs>
              <linearGradient id="colorActiveVolunteers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="colorInactiveVolunteers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px" }} />
            <Legend />
            <Area type="monotone" dataKey="active" stroke="#059669" fill="url(#colorActiveVolunteers)" strokeWidth={2} name="Active" />
            <Area type="monotone" dataKey="inactive" stroke="#94a3b8" fill="url(#colorInactiveVolunteers)" strokeWidth={2} name="Inactive" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Volunteer Engagement Trends</h3>
          <p className="mb-4 text-sm text-gray-500">New volunteer joins this year compared with the previous year.</p>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="currentYear" stroke="#059669" strokeWidth={3} dot={{ fill: "#059669", r: 4 }} name="Current Year" />
              <Line type="monotone" dataKey="previousYear" stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="6 6" dot={{ fill: "#94a3b8", r: 3 }} name="Previous Year" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-900">Last Activity By Weekday</h3>
              <p className="text-sm text-gray-500">Based on each volunteer's latest recorded activity date.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" ref={metricDropdownRef}>
                <button
                  onClick={() => setMetricOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <span>{selectedMetricLabel}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${metricOpen ? "rotate-180" : ""}`} />
                </button>

                {metricOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {metricOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedMetric(option.value); setMetricOpen(false); }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${selectedMetric === option.value ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={chartDropdownRef}>
                <button
                  onClick={() => setChartOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <span>{selectedChartLabel}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${chartOpen ? "rotate-180" : ""}`} />
                </button>

                {chartOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {chartOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedChart(option.value); setChartOpen(false); }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${selectedChart === option.value ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-semibold text-gray-900">Age Distribution</h3>
        <p className="mb-4 text-sm text-gray-500">Volunteer records grouped by age range.</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ageDistributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="group" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px" }} />
            <Bar dataKey="volunteers" radius={[8, 8, 0, 0]}>
              {ageDistributionData.map((entry, index) => (
                <Cell key={`age-cell-${entry.group}-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
