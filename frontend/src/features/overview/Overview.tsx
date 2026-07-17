import { useEffect, useRef, useState, type ReactNode } from "react";
import LastActivityChart from "@/components/LastActivityChart";
import DashboardStatCard from "@/components/StatCard";
import VolunteersByCityBarChart from "@/components/VolunteersByCityBarChart";
import VolunteersByGenderPieChart from "@/components/VolunteersByGenderPieChart";
import VolunteerBreakdownChart from "@/components/VolunteerBreakdownChart";
import { FileText, ChevronDown, Users, Clock3, Cake, MapPin, DollarSign, AlertCircle, Loader2, HelpCircle, Sparkles } from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";

const rangeOptions = ["All Time", "Last 3 Years", "This Year", "This Quarter"];
const rangeParamByLabel: Record<string, string> = {
  "All Time": "all_time",
  "Last 3 Years": "last_3_years",
  "This Year": "this_year",
  "This Quarter": "this_quarter",
};
const defaultVolunteerHourlyValue = 30.63;
const lastActivityChartStorageKey = "lastActivityChartType";

type LastActivityChartType = "line" | "bar" | "area";

const validLastActivityChartTypes: LastActivityChartType[] = ["bar", "line", "area"];

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

type AgeGroupBreakdownPoint = {
  age_group: string;
  count: number;
};

type EthnicityBreakdownPoint = {
  ethnicity: string;
  count: number;
};

type ChartPanelProps = {
  title: string;
  description: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  controls?: ReactNode;
  children: ReactNode;
};

function ChartPanel({
  title,
  description,
  loading,
  isEmpty,
  emptyMessage,
  controls,
  children,
}: ChartPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      {controls}

      {loading ? (
        <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading chart data...
        </div>
      ) : isEmpty ? (
        <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function Overview() {
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [rangeOpen, setRangeOpen] = useState(false);

  const [selectedRange, setSelectedRange] = useState("All Time");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [lastActivityData, setLastActivityData] = useState<LastActivityPoint[]>([]);
  const [genderData, setGenderData] = useState<GenderBreakdownPoint[]>([]);
  const [cityData, setCityData] = useState<CityBreakdownPoint[]>([]);
  const [ageGroupData, setAgeGroupData] = useState<AgeGroupBreakdownPoint[]>([]);
  const [ethnicityData, setEthnicityData] = useState<EthnicityBreakdownPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastActivityChartType, setLastActivityChartType] = useState<LastActivityChartType>(() => {
    const savedType = window.localStorage.getItem(lastActivityChartStorageKey) as LastActivityChartType | null;
    return savedType && validLastActivityChartTypes.includes(savedType) ? savedType : "line";
  });
  const [genderChartType, setGenderChartType] = useState<"pie" | "bar" | "horizontal">("pie");
  const [genderStartMonth, setGenderStartMonth] = useState("");
  const [genderEndMonth, setGenderEndMonth] = useState("");
  const [cityChartType, setCityChartType] = useState<"vertical" | "horizontal" | "pie">("vertical");
  const [ageGroupChartType, setAgeGroupChartType] = useState<"pie" | "bar" | "horizontal">("bar");
  const [ethnicityChartType, setEthnicityChartType] = useState<"pie" | "bar" | "horizontal">("horizontal");
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [lastActivityInsightLoading, setLastActivityInsightLoading] = useState(false);
  const [generatedLastActivityInsight, setGeneratedLastActivityInsight] = useState("");
  const [volunteerHourlyValue, setVolunteerHourlyValue] = useState(() => {
    const savedValue = window.localStorage.getItem("volunteerHourlyValue");
    const parsedValue = savedValue ? Number(savedValue) : defaultVolunteerHourlyValue;
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultVolunteerHourlyValue;
  });
  const [hourlyValueInput, setHourlyValueInput] = useState(volunteerHourlyValue.toString());

  const refreshDashboard = () => {
    setDashboardRefreshToken((currentValue) => currentValue + 1);
  };

  const handleGenerateReportClick = () => {
    console.log("Generate report clicked");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(target)) {
        setRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const chronologicalLastActivityData = [...lastActivityData].sort((firstItem, secondItem) =>
    firstItem.month.localeCompare(secondItem.month),
  );

  const busiestLastActivityMonth = chronologicalLastActivityData.reduce<LastActivityPoint | null>((busiestMonth, item) => {
    if (!busiestMonth || item.count > busiestMonth.count) {
      return item;
    }

    return busiestMonth;
  }, null);

  const lastActivityInsightMessages = busiestLastActivityMonth
    ? [
        `Looking at this range, ${busiestLastActivityMonth.month} stands out as the busiest recent-activity month. ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? " was" : "s were"} last active then, so this is a useful month to investigate if you are trying to understand recent engagement patterns.`,
        `${busiestLastActivityMonth.month} is the clearest peak in this view. That month has ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? "" : "s"} marked as last active, which may point to a strong event cycle, reporting update, or seasonal engagement pattern.`,
        `The main thing I notice is that recent activity is clustered most heavily around ${busiestLastActivityMonth.month}. With ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? "" : "s"} last active in that month, it is probably worth comparing against museum programming or volunteer campaigns from that period.`,
        `For this selected range, ${busiestLastActivityMonth.month} carries the highest volunteer count. ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? " lands" : "s land"} there, which makes it a good starting point for understanding where engagement was most concentrated.`,
        `This chart suggests ${busiestLastActivityMonth.month} was the strongest recent-activity month in the current view. Since ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? " was" : "s were"} last active then, the client may want to connect that spike back to scheduling, events, or data-entry timing.`,
      ]
    : [];

  const filteredGenderData = genderData;
  const ageGroupChartData = ageGroupData.map((item) => ({
    label: item.age_group,
    count: item.count,
  }));
  const ethnicityChartData = ethnicityData.map((item) => ({
    label: item.ethnicity,
    count: item.count,
  }));
  const estimatedValue = overview ? overview.hours_logged * volunteerHourlyValue : null;
  const selectedRangeParam = rangeParamByLabel[selectedRange] ?? "all_time";

  const saveHourlyValue = () => {
    const nextValue = Number(hourlyValueInput);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }
    setVolunteerHourlyValue(nextValue);
    window.localStorage.setItem("volunteerHourlyValue", nextValue.toString());
    setValueModalOpen(false);
  };

  const updateLastActivityChartType = (nextType: LastActivityChartType) => {
    setLastActivityChartType(nextType);
    window.localStorage.setItem(lastActivityChartStorageKey, nextType);
  };

  const generateLastActivityInsight = () => {
    if (lastActivityInsightMessages.length === 0 || lastActivityInsightLoading) {
      return;
    }

    setGeneratedLastActivityInsight("");
    setLastActivityInsightLoading(true);

    window.setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * lastActivityInsightMessages.length);
      setGeneratedLastActivityInsight(lastActivityInsightMessages[randomIndex]);
      setLastActivityInsightLoading(false);
    }, 1600);
  };

  useEffect(() => {
    setGeneratedLastActivityInsight("");
    setLastActivityInsightLoading(false);
  }, [selectedRangeParam, lastActivityData]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const rangeQuery = `range=${encodeURIComponent(selectedRangeParam)}`;

        const overviewResponse = await apiFetch(`/api/overview?${rangeQuery}`);

        await requireOk(overviewResponse, "Failed to fetch overview data.");

        const overviewJson: OverviewData = await overviewResponse.json();
        setOverview(overviewJson);

        const lineChartResponse = await apiFetch(`/api/charts/last-activity-by-month?${rangeQuery}`);

        await requireOk(lineChartResponse, "Failed to fetch line chart data.");

        const lineChartData: LastActivityPoint[] = await lineChartResponse.json();
        setLastActivityData(lineChartData);

        const genderChartResponse = await apiFetch(`/api/charts/volunteers-by-gender?${rangeQuery}&start=${genderStartMonth}&end=${genderEndMonth}`);

        await requireOk(genderChartResponse, "Failed to fetch gender chart data.");

        const genderChartData: GenderBreakdownPoint[] = await genderChartResponse.json();
        setGenderData(genderChartData);

        const cityChartResponse = await apiFetch(`/api/charts/volunteers-by-city?${rangeQuery}`);

        await requireOk(cityChartResponse, "Failed to fetch city chart data.");

        const cityChartData: CityBreakdownPoint[] = await cityChartResponse.json();
        setCityData(cityChartData);

        const ageGroupChartResponse = await apiFetch(`/api/charts/volunteers-by-age-group?${rangeQuery}`);

        await requireOk(ageGroupChartResponse, "Failed to fetch age group chart data.");

        const ageGroupChartData: AgeGroupBreakdownPoint[] = await ageGroupChartResponse.json();
        setAgeGroupData(ageGroupChartData);

        const ethnicityChartResponse = await apiFetch(`/api/charts/volunteers-by-ethnicity?${rangeQuery}`);

        await requireOk(ethnicityChartResponse, "Failed to fetch ethnicity chart data.");

        const ethnicityChartData: EthnicityBreakdownPoint[] = await ethnicityChartResponse.json();
        setEthnicityData(ethnicityChartData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(
          err instanceof Error
            ? `Could not load dashboard data: ${err.message}`
            : "Could not load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [genderStartMonth, genderEndMonth, selectedRangeParam, dashboardRefreshToken]);

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

          </div>
        </div>
      </div>

      {/* API-backed dashboard content */}
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading dashboard data...
          </div>
        )}
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={refreshDashboard}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && overview?.total_volunteers === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No volunteer records are available yet. Add volunteers from the Volunteers page or upload a dataset to populate dashboard metrics.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardStatCard title="Total Volunteers" value={overview?.total_volunteers ?? "--"} icon={Users} iconColor="bg-blue-600" />
          <DashboardStatCard title="Hours Logged" value={overview?.hours_logged ?? "--"} icon={Clock3} iconColor="bg-orange-500" />
          <DashboardStatCard title="Average Age" value={overview?.average_age ?? "--"} icon={Cake} iconColor="bg-purple-600" />
          <DashboardStatCard title="Cities Represented" value={overview?.cities_represented ?? "--"} icon={MapPin} iconColor="bg-green-600" />
          <DashboardStatCard
            title="Estimated Value"
            value={estimatedValue !== null ? `$${Math.round(estimatedValue).toLocaleString()}` : "--"}
            icon={DollarSign}
            iconColor="bg-emerald-600"
            action={(
              <button
                type="button"
                onClick={() => {
                  setHourlyValueInput(volunteerHourlyValue.toString());
                  setValueModalOpen(true);
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit estimated value calculation"
                title="Edit estimated value calculation"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
          />
        </div>

        {valueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Estimated Volunteer Value</h2>
                <p className="mt-1 text-sm text-slate-500">
                  This estimate multiplies logged volunteer hours by an hourly valuation.
                </p>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <span>Hours in current range</span>
                    <span className="font-medium text-slate-900">{overview?.hours_logged?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span>Current valuation</span>
                    <span className="font-medium text-slate-900">${volunteerHourlyValue.toLocaleString()}/hr</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-2">
                    <span>Estimated value</span>
                    <span className="font-semibold text-slate-900">
                      {estimatedValue !== null ? `$${Math.round(estimatedValue).toLocaleString()}` : "$0"}
                    </span>
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Hourly valuation*</span>
                  <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-600">
                    <span className="text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyValueInput}
                      onChange={(event) => setHourlyValueInput(event.target.value)}
                      className="h-10 w-full border-0 px-2 text-sm outline-none"
                    />
                    <span className="text-slate-500">/hr</span>
                  </div>
                  <span className="mt-2 block text-xs text-slate-500">
                    *Default based on Oklahoma volunteer time valuation.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setValueModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveHourlyValue}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <ChartPanel
            title="Recent Volunteer Activity"
            description="Volunteers grouped by the month of their most recent recorded activity."
            loading={loading}
            isEmpty={chronologicalLastActivityData.length === 0}
            emptyMessage="No volunteer activity was found for this time range."
            controls={(
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex max-w-xs flex-col">
                  <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                  <select
                    value={lastActivityChartType}
                    onChange={(event) => updateLastActivityChartType(event.target.value as LastActivityChartType)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateLastActivityInsight}
                  disabled={chronologicalLastActivityData.length === 0 || lastActivityInsightLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {lastActivityInsightLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {lastActivityInsightLoading ? "Generating..." : "Generate Insight"}
                </button>
              </div>
            )}
          >
            {generatedLastActivityInsight && (
              <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {generatedLastActivityInsight}
              </p>
            )}
            <LastActivityChart data={chronologicalLastActivityData} chartType={lastActivityChartType} />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by City"
            description="Number of volunteers grouped by city from the volunteers table."
            loading={loading}
            isEmpty={cityData.length === 0}
            emptyMessage="No city data is available yet."
            controls={(
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
            )}
          >

            <VolunteersByCityBarChart data={cityData} chartType={cityChartType} />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Gender"
            description="Gender breakdown of volunteers from the volunteers table."
            loading={loading}
            isEmpty={filteredGenderData.length === 0}
            emptyMessage="No gender data is available for the current filters."
            controls={(
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
            )}
          >

            <VolunteersByGenderPieChart data={filteredGenderData} chartType={genderChartType} />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Age Group"
            description="Age group breakdown of volunteers from the volunteers table."
            loading={loading}
            isEmpty={ageGroupChartData.length === 0}
            emptyMessage="No age group data is available yet."
            controls={(
              <div className="mt-4 flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
              <select
                value={ageGroupChartType}
                onChange={(event) => setAgeGroupChartType(event.target.value as "pie" | "bar" | "horizontal")}
                className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="bar">Bar / Column Chart</option>
                <option value="horizontal">Horizontal Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
              </div>
            )}
          >

            <VolunteerBreakdownChart
              data={ageGroupChartData}
              chartType={ageGroupChartType}
              sortMode="preserve"
            />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Ethnicity"
            description="Ethnicity breakdown of volunteers from the volunteers table."
            loading={loading}
            isEmpty={ethnicityChartData.length === 0}
            emptyMessage="No ethnicity data is available yet."
            controls={(
              <div className="mt-4 flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
              <select
                value={ethnicityChartType}
                onChange={(event) => setEthnicityChartType(event.target.value as "pie" | "bar" | "horizontal")}
                className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="horizontal">Horizontal Bar Chart</option>
                <option value="bar">Bar / Column Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
              </div>
            )}
          >

            <VolunteerBreakdownChart data={ethnicityChartData} chartType={ethnicityChartType} />
          </ChartPanel>
        </div>
      </div>

    </div>
  );
}
