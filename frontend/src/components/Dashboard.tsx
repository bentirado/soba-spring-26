import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import LastActivityChart from "./LastActivityChart";
import VolunteersByGenderPieChart from "./VolunteersByGenderPieChart";
import VolunteersByCityBarChart from "./VolunteersByCityBarChart";
import { Chatbot } from "./Chatbot";

// Type for the overview data returned by the backend.
type OverviewData = {
  total_volunteers: number;
  hours_logged: number;
  average_age: number;
  cities_represented: number;
};

// Type for each point returned by the line chart endpoint.
type LastActivityPoint = {
  month: string;
  count: number;
};

// Type for each gender breakdown item returned by the backend.
type GenderBreakdownPoint = {
  gender: string;
  count: number;
};

// Type for each city breakdown item returned by the backend.
type CityBreakdownPoint = {
  city: string;
  count: number;
};

export default function Dashboard() {
  // Base URL for the backend API.
  // If VITE_API_BASE_URL exists, use it.
  // Otherwise, fall back to the local FastAPI server.
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

  // Store overview card data from the backend.
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // Store line chart data from the backend.
  const [lastActivityData, setLastActivityData] = useState<LastActivityPoint[]>([]);
  // -----------------------------
  // Gender chart state variables:
  // -----------------------------
  // Store gender pie chart data from the backend.
  const [genderData, setGenderData] = useState<GenderBreakdownPoint[]>([]);
  // Store the selected chart type for the gender chart.
  const [genderChartType, setGenderChartType] = useState<"pie" | "bar" | "horizontal">("pie");
  // Store the selected date range for filtering the gender chart.
  const [genderStartMonth, setGenderStartMonth] = useState("");
  const [genderEndMonth, setGenderEndMonth] = useState("");
  // Store pie chart data from the backend.
  const [genderBreakdownData, setGenderBreakdownData] = useState<GenderBreakdownPoint[]>([]);

  // Store city bar chart data from the backend.
  const [cityData, setCityData] = useState<CityBreakdownPoint[]>([]);

  // Track whether the dashboard is still loading data.
  const [loading, setLoading] = useState(true);

  // Store any user-friendly error message if something fails.
  const [error, setError] = useState("");

  // Store the selected chart type for the last-activity chart.
  const [lastActivityChartType, setLastActivityChartType] = useState<"line" | "bar" | "area">("line");

  // Store the selected date range for filtering the last-activity chart.
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  // Store the selected chart type for the city chart.
  const [cityChartType, setCityChartType] = useState<"vertical" | "horizontal" | "pie">("vertical");

  // Filter last-activity data based on the selected start and end month.
  const filteredLastActivityData = lastActivityData.filter((item) => {
    const isAfterStart = !startMonth || item.month >= startMonth;
    const isBeforeEnd = !endMonth || item.month <= endMonth;
    return isAfterStart && isBeforeEnd;
  });

  // Filter gender chart data based on the selected start and end month.
  // This uses the month values already returned by the backend chart data shape.
  const filteredGenderData = genderData.filter((item) => {
    // Gender chart data itself does not include month, so we need to filter
    // from the raw volunteer dataset if we want true date filtering.
    // For now, this placeholder keeps the existing gender data unchanged.
    return true;
  });

  useEffect(() => {
    // Fetch all dashboard data from the backend when the page first loads.
    async function fetchDashboardData() {
      try {
        // -----------------------------
        // Fetch overview card data
        // -----------------------------
        const overviewResponse = await fetch(`${apiBaseUrl}/api/overview`);

        if (!overviewResponse.ok) {
          throw new Error("Failed to fetch overview data");
        }

        // Parse the overview response JSON.
        const overviewJson: OverviewData = await overviewResponse.json();

        // Save overview data in state.
        setOverview(overviewJson);

        // -----------------------------
        // Fetch line chart data
        // -----------------------------
        const lineChartResponse = await fetch(`${apiBaseUrl}/api/charts/last-activity-by-month`);

        if (!lineChartResponse.ok) {
          throw new Error("Failed to fetch line chart data");
        }

        // Parse the line chart response JSON.
        const lineChartData: LastActivityPoint[] = await lineChartResponse.json();

        // Save line chart data in state.
        setLastActivityData(lineChartData);

        // -----------------------------
        // Fetch gender pie chart data
        // -----------------------------

        const genderChartResponse = await fetch(`${apiBaseUrl}/api/charts/volunteers-by-gender?start=${genderStartMonth}&end=${genderEndMonth}`);

        if (!genderChartResponse.ok) {
          throw new Error("Failed to fetch gender chart data");
        }

        // Parse the gender chart response JSON.
        const genderChartData: GenderBreakdownPoint[] = await genderChartResponse.json();

        // Save gender chart data in state.
        setGenderData(genderChartData);

        // -----------------------------
        // Fetch city bar chart data
        // -----------------------------
        const cityChartResponse = await fetch(`${apiBaseUrl}/api/charts/volunteers-by-city`);

        if (!cityChartResponse.ok) {
          throw new Error("Failed to fetch city chart data");
        }

        // Parse the city chart response JSON.
        const cityChartData: CityBreakdownPoint[] = await cityChartResponse.json();

        // Save city chart data in state.
        setCityData(cityChartData);
      } catch (err) {
        // Log the raw error for debugging in the browser console.
        console.error("Dashboard fetch error:", err);

        // Show a friendly message in the UI.
        setError("Could not load dashboard data.");
      } finally {
        // Stop the loading state whether the requests succeed or fail.
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [apiBaseUrl, genderStartMonth, genderEndMonth]);

  console.log("Dashboard render", {
    overview,
    lastActivityData,
    genderData,
    cityData,
  });

  return (
    <div className="min-h-screen bg-white-100 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Volunteer Dashboard</h1>
          <p className="mt-2 text-slate-600">Overview cards and charts for volunteer insights.</p>
        </div>

        {/* Loading state */}
        {loading && <p className="mb-4 text-slate-600">Loading dashboard...</p>}

        {/* Error state */}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {/* Overview cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Volunteers" value={overview?.total_volunteers ?? "--"} />
          <StatCard title="Hours Logged" value={overview?.hours_logged ?? "--"} />
          <StatCard title="Average Age" value={overview?.average_age ?? "--"} />
          <StatCard title="Cities Represented" value={overview?.cities_represented ?? "--"} />
        </div>

        {/* Charts section */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          {/* Full-width line chart card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Last Activity by Month</h2>
            <p className="mt-1 text-sm text-slate-500">Number of volunteers grouped by their most recent recorded activity month.</p>

            {/* Controls for chart type and date range filtering */}
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
              {/* Chart type dropdown */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                <select
                  value={lastActivityChartType}
                  onChange={(e) => setLastActivityChartType(e.target.value as "line" | "bar" | "area")}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar / Column Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>

              {/* Start month filter */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Start Month</label>
                <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm" />
              </div>

              {/* End month filter */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">End Month</label>
                <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm" />
              </div>
            </div>

            <LastActivityChart data={filteredLastActivityData} chartType={lastActivityChartType} />
          </div>

          {/* Full-width city bar chart card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Volunteers by City</h2>
            <p className="mt-1 text-sm text-slate-500">Number of volunteers grouped by city from the mock dataset.</p>

            {/* Control for selecting the city chart type */}
            <div className="mt-4 flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
              <select
                value={cityChartType}
                onChange={(e) => setCityChartType(e.target.value as "vertical" | "horizontal")}
                className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="vertical">Column Chart</option>
                <option value="horizontal">Horizontal Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <VolunteersByCityBarChart data={cityData} chartType={cityChartType} />
          </div>

          {/* Full-width gender pie chart card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Volunteers by Gender</h2>
            <p className="mt-1 text-sm text-slate-500">Gender breakdown of volunteers from the mock dataset.</p>

            {/* Controls for selecting the gender chart type and date range */}
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
              {/* Chart type dropdown */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                <select
                  value={genderChartType}
                  onChange={(e) => setGenderChartType(e.target.value as "pie" | "bar" | "horizontal")}
                  className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="pie">Pie Chart</option>
                  <option value="bar">Bar / Column Chart</option>
                  <option value="horizontal">Horizontal Bar Chart</option>
                </select>
              </div>

              {/* Start month filter */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">Start Month</label>
                <input
                  type="month"
                  value={genderStartMonth}
                  onChange={(e) => setGenderStartMonth(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </div>

              {/* End month filter */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-slate-700">End Month</label>
                <input type="month" value={genderEndMonth} onChange={(e) => setGenderEndMonth(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm" />
              </div>
            </div>

            <VolunteersByGenderPieChart data={filteredGenderData} chartType={genderChartType} />
          </div>
        </div>
        {/* Chatbot (floating) - renders a floating toggle button and chat window */}
        <Chatbot />
      </div>
    </div>
  );
}
