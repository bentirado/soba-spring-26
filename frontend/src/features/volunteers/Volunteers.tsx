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
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Download,
  FileUp,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch, requireOk } from "@/lib/api";
import { generateInsight as generateAiInsight } from "@/lib/insights";

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
const volunteerMetricStorageKey = "volunteerWeeklyMetric";
const volunteerChartStorageKey = "volunteerWeeklyChart";

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
  const normalizeHeader = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");
  const getValue = (row: SpreadsheetRow, headers: string[]) => {
    const normalizedHeaders = headers.map(normalizeHeader);
    const matchingKey = Object.keys(row).find((key) => normalizedHeaders.includes(normalizeHeader(key)));
    return matchingKey ? String(row[matchingKey] ?? "").trim() : "";
  };

  return rows.map((row) => ({
    City: getValue(row, ["City"]),
    State: getValue(row, ["State"]),
    Zip: getValue(row, ["Zip", "Zip Code", "Postal Code"]),
    Age: getValue(row, ["Age"]),
    Gender: getValue(row, ["Gender"]),
    Ethnicity: getValue(row, ["Ethnicity", "Race/Ethnicity", "Race Ethnicity"]),
    Race_Ethnicity: getValue(row, ["Race/Ethnicity", "Race Ethnicity", "Ethnicity"]),
    Dietary_Restrictions: getValue(row, ["Dietary Restrictions", "Dietary_Restrictions"]),
    Hispanic_Latino_Or_Spanish: getValue(row, [
      "Hispanic, Latino Or Spanish",
      "Hispanic Latino Or Spanish",
      "Hispanic_Latino_Or_Spanish",
    ]),
    Life_Hours: getValue(row, ["Life Hours", "Life_Hours", "Lifetime Hours", "Hours"]),
    Date_Of_Last_Activity: getValue(row, [
      "Date Of Last Activity",
      "Date_Of_Last_Activity",
      "Date of Last Activity",
      "Last Activity",
      "Last Activity Date",
    ]),
    Age_1: getValue(row, ["Age_1", "Age.1", "Age Group", "Age Range"]),
    Age_Group: getValue(row, ["Age Group", "Age Range", "Age_1", "Age.1"]),
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

function hasValue(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value);
  return Boolean(value?.trim());
}

function getVolunteerDisplayName(volunteer: Volunteer) {
  if (volunteer.first_name === "Spreadsheet" && volunteer.last_name.startsWith("Row ")) {
    const rowNumber = Number(volunteer.last_name.replace("Row ", ""));
    return Number.isFinite(rowNumber) ? `Volunteer #${rowNumber.toString().padStart(3, "0")}` : "Volunteer";
  }

  return `${volunteer.first_name} ${volunteer.last_name}`.trim();
}

function downloadCsv(volunteers: Volunteer[]) {
  const headers = [
    "Volunteer Label",
    "Email",
    "City",
    "State",
    "Age",
    "Gender",
    "Life Hours",
    "Last Activity",
  ];
  const rows = volunteers.map((volunteer) => [
    getVolunteerDisplayName(volunteer),
    volunteer.email ?? "",
    volunteer.city ?? "",
    volunteer.state,
    volunteer.age?.toString() ?? "",
    volunteer.gender ?? "",
    volunteer.life_hours?.toString() ?? "",
    volunteer.last_activity ?? "",
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
  const [sortBy, setSortBy] = useState<SortValue>("hours-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>(() => {
    const savedMetric = window.localStorage.getItem(volunteerMetricStorageKey) as MetricValue | null;
    return savedMetric && metricOptions.some((option) => option.value === savedMetric) ? savedMetric : "volunteers";
  });
  const [selectedChart, setSelectedChart] = useState<ChartValue>(() => {
    const savedChart = window.localStorage.getItem(volunteerChartStorageKey) as ChartValue | null;
    return savedChart && chartOptions.some((option) => option.value === savedChart) ? savedChart : "bar";
  });
  const [importUploading, setImportUploading] = useState(false);
  const [importError, setImportError] = useState("");
  const [selectedImportFileName, setSelectedImportFileName] = useState("");
  const [monthlyInsightLoading, setMonthlyInsightLoading] = useState(false);
  const [generatedMonthlyInsight, setGeneratedMonthlyInsight] = useState("");
  const [yearInsightLoading, setYearInsightLoading] = useState(false);
  const [generatedYearInsight, setGeneratedYearInsight] = useState("");
  const [weekdayInsightLoading, setWeekdayInsightLoading] = useState(false);
  const [generatedWeekdayInsight, setGeneratedWeekdayInsight] = useState("");
  const [ageInsightLoading, setAgeInsightLoading] = useState(false);
  const [generatedAgeInsight, setGeneratedAgeInsight] = useState("");

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

      return !query || searchableText.includes(query);
    });
  }, [searchQuery, volunteers]);

  const sortedVolunteers = useMemo(() => {
    const sorted = [...filteredVolunteers];

    sorted.sort((a, b) => {
      if (sortBy === "name-asc") {
        return getVolunteerDisplayName(a).localeCompare(getVolunteerDisplayName(b));
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
  }, [searchQuery, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const totalVolunteers = volunteers.length;
  const totalHours = volunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);
  const averageHours = totalVolunteers ? totalHours / totalVolunteers : 0;
  const completenessFields = volunteers.flatMap((volunteer) => [
    volunteer.city,
    volunteer.state,
    volunteer.zip,
    volunteer.age,
    volunteer.gender,
    volunteer.ethnicity,
    volunteer.life_hours,
    volunteer.last_activity,
  ]);
  const filledCompletenessFields = completenessFields.filter(hasValue).length;
  const dataCompletenessPercent = completenessFields.length
    ? Math.round((filledCompletenessFields / completenessFields.length) * 100)
    : 0;
  const mostRecentActivity = volunteers.reduce<string | null>((currentLatest, volunteer) => {
    if (!volunteer.last_activity) return currentLatest;
    if (!currentLatest || volunteer.last_activity > currentLatest) return volunteer.last_activity;
    return currentLatest;
  }, null);

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

  const lastActivityByMonthData = useMemo(() => {
    const buckets = monthLabels.map((month) => ({ month, volunteers: 0, hours: 0 }));
    volunteers.forEach((volunteer) => {
      const monthIndex = getMonthIndex(volunteer.last_activity);
      if (monthIndex == null) return;
      buckets[monthIndex].volunteers += 1;
      buckets[monthIndex].hours += volunteer.life_hours ?? 0;
    });
    return buckets.map((bucket) => ({ ...bucket, hours: Number(bucket.hours.toFixed(1)) }));
  }, [volunteers]);

  const activityYearComparisonData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const buckets = monthLabels.map((month) => ({ month, currentYear: 0, previousYear: 0 }));
    volunteers.forEach((volunteer) => {
      if (!volunteer.last_activity) return;
      const activityDate = new Date(`${volunteer.last_activity}T00:00:00`);
      if (Number.isNaN(activityDate.getTime())) return;
      const monthIndex = activityDate.getMonth();
      const hours = volunteer.life_hours ?? 0;
      if (activityDate.getFullYear() === currentYear) buckets[monthIndex].currentYear += hours;
      if (activityDate.getFullYear() === previousYear) buckets[monthIndex].previousYear += hours;
    });
    return buckets.map((bucket) => ({
      ...bucket,
      currentYear: Number(bucket.currentYear.toFixed(1)),
      previousYear: Number(bucket.previousYear.toFixed(1)),
    }));
  }, [volunteers]);
  const busiestActivityMonth = lastActivityByMonthData.reduce(
    (current, next) => (next.volunteers > current.volunteers ? next : current),
    lastActivityByMonthData[0],
  );
  const highestHoursMonth = lastActivityByMonthData.reduce(
    (current, next) => (next.hours > current.hours ? next : current),
    lastActivityByMonthData[0],
  );
  const currentYearHours = activityYearComparisonData.reduce((sum, month) => sum + month.currentYear, 0);
  const previousYearHours = activityYearComparisonData.reduce((sum, month) => sum + month.previousYear, 0);
  const yearHoursDifference = currentYearHours - previousYearHours;
  const monthlyInsightMessages = busiestActivityMonth
    ? [
        `${busiestActivityMonth.month} has the strongest latest-activity count in this dataset, with ${busiestActivityMonth.volunteers.toLocaleString()} volunteer${busiestActivityMonth.volunteers === 1 ? "" : "s"} landing there.`,
        `The monthly activity pattern peaks in ${busiestActivityMonth.month}. That month has ${busiestActivityMonth.volunteers.toLocaleString()} latest-activity record${busiestActivityMonth.volunteers === 1 ? "" : "s"}, while ${highestHoursMonth.month} carries the highest hour total at ${highestHoursMonth.hours.toLocaleString()} hours.`,
        `I would look first at ${busiestActivityMonth.month}. It is the clearest activity-month signal and can help the client understand when the uploaded records are most concentrated.`,
        `${highestHoursMonth.month} stands out from an hours perspective with ${highestHoursMonth.hours.toLocaleString()} logged hours. Comparing that against ${busiestActivityMonth.month}'s volunteer count can show whether activity volume and hour volume are moving together.`,
        `This chart suggests the dataset has a noticeable monthly concentration around ${busiestActivityMonth.month}. That is a useful starting point for checking seasonality, major events, or reporting patterns.`,
      ]
    : [];
  const yearInsightMessages = [
    `This year currently shows ${currentYearHours.toLocaleString()} hours, compared with ${previousYearHours.toLocaleString()} hours in the previous year. That is a ${yearHoursDifference >= 0 ? "positive" : "negative"} difference of ${Math.abs(yearHoursDifference).toLocaleString()} hours.`,
    `The year comparison is useful for spotting whether activity is shifting. Right now, this year is ${yearHoursDifference >= 0 ? "ahead of" : "behind"} the previous year by ${Math.abs(yearHoursDifference).toLocaleString()} hours.`,
    `From an hours perspective, this year's line totals ${currentYearHours.toLocaleString()} hours. The previous-year comparison is ${previousYearHours.toLocaleString()} hours, so the client can quickly see how current activity compares with the prior pattern.`,
    `The main thing I notice is the year-over-year gap: ${Math.abs(yearHoursDifference).toLocaleString()} hours ${yearHoursDifference >= 0 ? "above" : "below"} the previous year. That gives this chart a clearer performance signal than looking at either line alone.`,
    `This chart helps separate current activity from prior-year context. At the moment, this year is ${yearHoursDifference >= 0 ? "running higher" : "running lower"} than the previous year by ${Math.abs(yearHoursDifference).toLocaleString()} hours.`,
  ];

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

  const largestAgeGroup = ageDistributionData.reduce(
    (current, next) => (next.volunteers > current.volunteers ? next : current),
    ageDistributionData[0],
  );
  const largestAgeGroupShare = largestAgeGroup && totalVolunteers
    ? Math.round((largestAgeGroup.volunteers / totalVolunteers) * 100)
    : 0;
  const weekdayInsightMessages = mostActiveDay
    ? [
        `${mostActiveDay.day} has the strongest latest-activity signal in this dataset, with ${mostActiveDay.volunteers.toLocaleString()} volunteer${mostActiveDay.volunteers === 1 ? "" : "s"} last active on that weekday.`,
        `The weekday pattern points most clearly to ${mostActiveDay.day}. That day has ${mostActiveDay.volunteers.toLocaleString()} recent-activity record${mostActiveDay.volunteers === 1 ? "" : "s"}, which may reflect common scheduling or data-entry timing.`,
        `I would look first at ${mostActiveDay.day}. It leads the weekday view and accounts for ${mostActiveDay.participation}% of the uploaded volunteer records with a latest activity date.`,
        `${mostActiveDay.day} stands out in this chart. If the client is trying to understand when volunteer activity clusters, this is the weekday worth investigating first.`,
        `This dataset shows the most latest-activity records landing on ${mostActiveDay.day}. That can help frame conversations about volunteer shifts, events, or reporting patterns.`,
      ]
    : [];
  const ageInsightMessages = largestAgeGroup
    ? [
        `${largestAgeGroup.group} is the largest age group in the uploaded dataset, with ${largestAgeGroup.volunteers.toLocaleString()} volunteer${largestAgeGroup.volunteers === 1 ? "" : "s"} or about ${largestAgeGroupShare}% of all records.`,
        `The age distribution is most concentrated in ${largestAgeGroup.group}. That group is a useful starting point when discussing who the current volunteer base most strongly represents.`,
        `I would call out ${largestAgeGroup.group} as the clearest age signal here. It gives the client a quick read on where participation is currently concentrated.`,
        `${largestAgeGroup.group} leads the age breakdown in this dataset. If the client has recruitment goals, this is a good category to compare against their desired volunteer mix.`,
        `This chart suggests the uploaded volunteer base is weighted most heavily toward ${largestAgeGroup.group}, which may be useful when planning roles, schedules, and outreach.`,
      ]
    : [];

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

  const updateSelectedMetric = (metric: MetricValue) => {
    setSelectedMetric(metric);
    window.localStorage.setItem(volunteerMetricStorageKey, metric);
    setMetricOpen(false);
  };

  const updateSelectedChart = (chart: ChartValue) => {
    setSelectedChart(chart);
    window.localStorage.setItem(volunteerChartStorageKey, chart);
    setChartOpen(false);
  };

  const generateWeekdayInsight = async () => {
    if (weeklyActivityData.every((item) => item.volunteers === 0) || weekdayInsightLoading) return;
    setGeneratedWeekdayInsight("");
    setWeekdayInsightLoading(true);
    try {
      const insight = await generateAiInsight({
        page: "Volunteers",
        subject: "Last Activity By Weekday",
        context: `Selected metric in the UI: ${selectedMetricLabel}. Based on each volunteer's latest recorded activity date.`,
        data: weeklyActivityData,
      });
      setGeneratedWeekdayInsight(insight);
    } catch (err) {
      setGeneratedWeekdayInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setWeekdayInsightLoading(false);
    }
  };

  const generateMonthlyInsight = async () => {
    if (lastActivityByMonthData.every((item) => item.volunteers === 0) || monthlyInsightLoading) return;
    setGeneratedMonthlyInsight("");
    setMonthlyInsightLoading(true);
    try {
      const insight = await generateAiInsight({
        page: "Volunteers",
        subject: "Last Activity by Month",
        context: "Uploaded records grouped by latest activity month, with lifetime hours layered in.",
        data: lastActivityByMonthData,
      });
      setGeneratedMonthlyInsight(insight);
    } catch (err) {
      setGeneratedMonthlyInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setMonthlyInsightLoading(false);
    }
  };

  const generateYearInsight = async () => {
    if ((currentYearHours === 0 && previousYearHours === 0) || yearInsightLoading) return;
    setGeneratedYearInsight("");
    setYearInsightLoading(true);
    try {
      const insight = await generateAiInsight({
        page: "Volunteers",
        subject: "Activity Hours by Year",
        context: `Compare lifetime hours grouped by latest activity month. This year total: ${currentYearHours}. Previous year total: ${previousYearHours}.`,
        data: activityYearComparisonData,
      });
      setGeneratedYearInsight(insight);
    } catch (err) {
      setGeneratedYearInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setYearInsightLoading(false);
    }
  };

  const generateAgeInsight = async () => {
    if (ageDistributionData.length === 0 || ageInsightLoading) return;
    setGeneratedAgeInsight("");
    setAgeInsightLoading(true);
    try {
      const insight = await generateAiInsight({
        page: "Volunteers",
        subject: "Age Distribution",
        context: `Total uploaded records: ${totalVolunteers}. Explain the age distribution without assuming why it exists.`,
        data: ageDistributionData.map(({ group, volunteers }) => ({ group, volunteers })),
      });
      setGeneratedAgeInsight(insight);
    } catch (err) {
      setGeneratedAgeInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setAgeInsightLoading(false);
    }
  };

  useEffect(() => {
    setGeneratedMonthlyInsight("");
    setMonthlyInsightLoading(false);
    setGeneratedYearInsight("");
    setYearInsightLoading(false);
    setGeneratedWeekdayInsight("");
    setWeekdayInsightLoading(false);
    setGeneratedAgeInsight("");
    setAgeInsightLoading(false);
  }, [volunteers]);

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
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Volunteer Dataset Explorer</h1>
          <p className="text-sm text-gray-500">Replace, inspect, export, and analyze the active uploaded volunteer spreadsheet.</p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Database className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Volunteer Count</p>
          <p className="text-sm text-gray-500">People included in upload</p>
          <p className="mt-4 text-2xl font-semibold text-blue-600">{loading ? "--" : totalVolunteers.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Clock3 className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Total Hours</p>
          <p className="text-sm text-gray-500">Avg. {averageHours.toFixed(1)} hrs per row</p>
          <p className="mt-4 text-2xl font-semibold text-orange-500">{loading ? "--" : totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Data Completeness</p>
          <p className="text-sm text-gray-500">Key spreadsheet fields filled</p>
          <p className="mt-4 text-2xl font-semibold text-green-600">{loading ? "--" : `${dataCompletenessPercent}%`}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="mb-1 text-xl font-semibold text-gray-900">Latest Activity</p>
          <p className="text-sm text-gray-500">Most recent date in upload</p>
          <p className="mt-4 text-2xl font-semibold text-purple-600">{loading ? "--" : formatDate(mostRecentActivity)}</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                      Loading volunteers...
                    </td>
                  </tr>
                ) : filteredVolunteers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                      No uploaded spreadsheet rows match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedVolunteers.map((volunteer) => (
                    <tr key={volunteer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {getVolunteerDisplayName(volunteer)}
                        </div>
                        {volunteer.email && <div className="text-xs text-gray-500">{volunteer.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {[volunteer.city, volunteer.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{volunteer.age ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{volunteer.gender || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{(volunteer.life_hours ?? 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(volunteer.last_activity)}</td>
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="mb-1 text-xl font-semibold text-gray-900">Last Activity by Month</h3>
            <p className="text-sm text-gray-500">Uploaded records grouped by latest activity month, with lifetime hours layered in.</p>
          </div>
          <button
            type="button"
            onClick={generateMonthlyInsight}
            disabled={lastActivityByMonthData.every((item) => item.volunteers === 0) || monthlyInsightLoading}
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {monthlyInsightLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {monthlyInsightLoading ? "Generating..." : "AI"}
          </button>
        </div>

        {generatedMonthlyInsight && (
          <p className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {generatedMonthlyInsight}
          </p>
        )}

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={lastActivityByMonthData}>
            <defs>
              <linearGradient id="colorActivityVolunteers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="colorActivityHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px" }} />
            <Legend />
            <Area type="monotone" dataKey="volunteers" stroke="#2563eb" fill="url(#colorActivityVolunteers)" strokeWidth={2} name="Volunteers" />
            <Area type="monotone" dataKey="hours" stroke="#f97316" fill="url(#colorActivityHours)" strokeWidth={2} name="Hours" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-900">Activity Hours by Year</h3>
              <p className="text-sm text-gray-500">Lifetime hours grouped by latest activity month for this year and the prior year.</p>
            </div>
            <button
              type="button"
              onClick={generateYearInsight}
              disabled={(currentYearHours === 0 && previousYearHours === 0) || yearInsightLoading}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {yearInsightLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {yearInsightLoading ? "Generating..." : "AI"}
            </button>
          </div>

          {generatedYearInsight && (
            <p className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {generatedYearInsight}
            </p>
          )}

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={activityYearComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="currentYear" stroke="#059669" strokeWidth={3} dot={{ fill: "#059669", r: 4 }} name="This Year" />
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
                        onClick={() => updateSelectedMetric(option.value)}
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
                        onClick={() => updateSelectedChart(option.value)}
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

          <div className="mb-4">
            <button
              type="button"
              onClick={generateWeekdayInsight}
              disabled={weeklyActivityData.every((item) => item.volunteers === 0) || weekdayInsightLoading}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {weekdayInsightLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {weekdayInsightLoading ? "Generating..." : "AI"}
            </button>
            {generatedWeekdayInsight && (
              <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {generatedWeekdayInsight}
              </p>
            )}
          </div>

          {renderWeeklyActivityChart()}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="mb-1 text-xl font-semibold text-gray-900">Age Distribution</h3>
            <p className="text-sm text-gray-500">Uploaded records grouped by age range.</p>
          </div>
          <button
            type="button"
            onClick={generateAgeInsight}
            disabled={ageDistributionData.length === 0 || ageInsightLoading}
            className="inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ageInsightLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {ageInsightLoading ? "Generating..." : "AI"}
          </button>
        </div>

        {generatedAgeInsight && (
          <p className="mb-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800">
            {generatedAgeInsight}
          </p>
        )}

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
