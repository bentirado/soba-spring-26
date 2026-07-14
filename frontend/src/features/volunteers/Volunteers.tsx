import { useEffect, useMemo, useRef, useState } from "react";
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
  Pencil,
  Plus,
  Power,
  Search,
  TrendingUp,
  UserCheck,
} from "lucide-react";
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

type VolunteerFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  age: string;
  age_group: string;
  gender: string;
  ethnicity: string;
  hispanic_latino: string;
  dietary_restrictions: string;
  joined_date: string;
  last_activity: string;
  life_hours: string;
  is_active: boolean;
};

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

const emptyVolunteerForm: VolunteerFormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "OK",
  zip: "",
  age: "",
  age_group: "",
  gender: "",
  ethnicity: "",
  hispanic_latino: "",
  dietary_restrictions: "None",
  joined_date: "",
  last_activity: "",
  life_hours: "",
  is_active: true,
};

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

function volunteerToForm(volunteer: Volunteer): VolunteerFormState {
  return {
    first_name: volunteer.first_name,
    last_name: volunteer.last_name,
    email: volunteer.email ?? "",
    phone: volunteer.phone ?? "",
    city: volunteer.city ?? "",
    state: volunteer.state || "OK",
    zip: volunteer.zip ?? "",
    age: volunteer.age?.toString() ?? "",
    age_group: volunteer.age_group ?? "",
    gender: volunteer.gender ?? "",
    ethnicity: volunteer.ethnicity ?? "",
    hispanic_latino: volunteer.hispanic_latino ?? "",
    dietary_restrictions: volunteer.dietary_restrictions || "None",
    joined_date: volunteer.joined_date ?? "",
    last_activity: volunteer.last_activity ?? "",
    life_hours: volunteer.life_hours?.toString() ?? "",
    is_active: volunteer.is_active,
  };
}

function formToPayload(form: VolunteerFormState) {
  return {
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email || null,
    phone: form.phone || null,
    city: form.city || null,
    state: form.state || "OK",
    zip: form.zip || null,
    age: form.age ? Number(form.age) : null,
    age_group: form.age_group || null,
    gender: form.gender || null,
    ethnicity: form.ethnicity || null,
    hispanic_latino: form.hispanic_latino || null,
    dietary_restrictions: form.dietary_restrictions || "None",
    joined_date: form.joined_date || null,
    last_activity: form.last_activity || null,
    life_hours: form.life_hours ? Number(form.life_hours) : null,
    is_active: form.is_active,
  };
}

export function Volunteers() {
  const metricDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [metricOpen, setMetricOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("volunteers");
  const [selectedChart, setSelectedChart] = useState<ChartValue>("bar");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [form, setForm] = useState<VolunteerFormState>(emptyVolunteerForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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

  const openCreateForm = () => {
    setEditingVolunteer(null);
    setForm(emptyVolunteerForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setForm(volunteerToForm(volunteer));
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
    setEditingVolunteer(null);
    setForm(emptyVolunteerForm);
    setFormError("");
  };

  const setFormField = (field: keyof VolunteerFormState, value: string | boolean) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const saveVolunteer = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("First and last name are required.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      const response = await apiFetch(
        editingVolunteer ? `/api/volunteers/${editingVolunteer.id}` : "/api/volunteers",
        {
          method: editingVolunteer ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        },
      );
      await requireOk(response, "Failed to save volunteer.");
      await fetchVolunteers();
      closeForm();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? `Failed to save volunteer: ${err.message}`
          : "Failed to save volunteer.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleVolunteerStatus = async (volunteer: Volunteer) => {
    try {
      setError("");
      const response = await apiFetch(`/api/volunteers/${volunteer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formToPayload(volunteerToForm(volunteer)),
          is_active: !volunteer.is_active,
        }),
      });
      await requireOk(response, "Failed to update volunteer status.");
      await fetchVolunteers();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not update volunteer status: ${err.message}`
          : "Could not update volunteer status.",
      );
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
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Volunteer
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
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
            <p className="text-sm text-gray-500">Search and filter records loaded from the volunteers table.</p>
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
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      Loading volunteers...
                    </td>
                  </tr>
                ) : filteredVolunteers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      No volunteer records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVolunteers.slice(0, 25).map((volunteer) => (
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(volunteer)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                            title="Edit volunteer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleVolunteerStatus(volunteer)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
                              volunteer.is_active
                                ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={volunteer.is_active ? "Deactivate volunteer" : "Activate volunteer"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {filteredVolunteers.length > 25 && (
          <p className="mt-3 text-xs text-gray-500">Showing first 25 of {filteredVolunteers.length} matching records.</p>
        )}
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingVolunteer ? "Edit Volunteer" : "Add Volunteer"}
                </h2>
                <p className="text-sm text-gray-500">
                  Manage staff-maintained volunteer records.
                </p>
              </div>
              <button
                onClick={closeForm}
                className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">First Name *</span>
                <input value={form.first_name} onChange={(event) => setFormField("first_name", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Last Name *</span>
                <input value={form.last_name} onChange={(event) => setFormField("last_name", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Email</span>
                <input type="email" value={form.email} onChange={(event) => setFormField("email", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Phone</span>
                <input value={form.phone} onChange={(event) => setFormField("phone", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">City</span>
                <input value={form.city} onChange={(event) => setFormField("city", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">State</span>
                  <input maxLength={2} value={form.state} onChange={(event) => setFormField("state", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-blue-600" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Zip</span>
                  <input value={form.zip} onChange={(event) => setFormField("zip", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Age</span>
                  <input type="number" min="0" value={form.age} onChange={(event) => setFormField("age", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Age Group</span>
                  <input value={form.age_group} onChange={(event) => setFormField("age_group", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
                </label>
              </div>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Gender</span>
                <input value={form.gender} onChange={(event) => setFormField("gender", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Ethnicity</span>
                <input value={form.ethnicity} onChange={(event) => setFormField("ethnicity", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Hispanic/Latino</span>
                <select value={form.hispanic_latino} onChange={(event) => setFormField("hispanic_latino", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="">Unspecified</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Dietary Restrictions</span>
                <input value={form.dietary_restrictions} onChange={(event) => setFormField("dietary_restrictions", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Joined Date</span>
                <input type="date" value={form.joined_date} onChange={(event) => setFormField("joined_date", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Last Activity</span>
                <input type="date" value={form.last_activity} onChange={(event) => setFormField("last_activity", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Life Hours</span>
                <input type="number" min="0" step="0.1" value={form.life_hours} onChange={(event) => setFormField("life_hours", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
              </label>
              <label className="flex items-center gap-2 pt-7 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setFormField("is_active", event.target.checked)} />
                Active volunteer
              </label>
            </div>

            {formError && (
              <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveVolunteer}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
