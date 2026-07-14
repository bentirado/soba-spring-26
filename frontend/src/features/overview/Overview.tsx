import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import LastActivityChart from "@/components/LastActivityChart";
import DashboardStatCard from "@/components/StatCard";
import VolunteersByCityBarChart from "@/components/VolunteersByCityBarChart";
import VolunteersByGenderPieChart from "@/components/VolunteersByGenderPieChart";
import VolunteerBreakdownChart from "@/components/VolunteerBreakdownChart";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, ChevronDown, Users, Clock3, Cake, MapPin, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";

const rangeOptions = ["Last 30 Days", "This Quarter", "This Year", "All Time"];
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dataActionsRef = useRef<HTMLDivElement | null>(null);
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [pendingUploadRows, setPendingUploadRows] = useState<SpreadsheetRow[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dataActionsOpen, setDataActionsOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);

  const [selectedRange, setSelectedRange] = useState("Last 30 Days");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [lastActivityData, setLastActivityData] = useState<LastActivityPoint[]>([]);
  const [genderData, setGenderData] = useState<GenderBreakdownPoint[]>([]);
  const [cityData, setCityData] = useState<CityBreakdownPoint[]>([]);
  const [ageGroupData, setAgeGroupData] = useState<AgeGroupBreakdownPoint[]>([]);
  const [ethnicityData, setEthnicityData] = useState<EthnicityBreakdownPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastActivityChartType, setLastActivityChartType] = useState<"line" | "bar" | "area">("line");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [genderChartType, setGenderChartType] = useState<"pie" | "bar" | "horizontal">("pie");
  const [genderStartMonth, setGenderStartMonth] = useState("");
  const [genderEndMonth, setGenderEndMonth] = useState("");
  const [cityChartType, setCityChartType] = useState<"vertical" | "horizontal" | "pie">("vertical");
  const [ageGroupChartType, setAgeGroupChartType] = useState<"pie" | "bar" | "horizontal">("bar");
  const [ethnicityChartType, setEthnicityChartType] = useState<"pie" | "bar" | "horizontal">("horizontal");
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);

  const refreshDashboard = () => {
    setDashboardRefreshToken((currentValue) => currentValue + 1);
  };

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

      const response = await apiFetch("/api/volunteers/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: normalizedRows,
        }),
      });

      await requireOk(response, "Failed to upload volunteer data.");

      const result = await response.json();
      console.log("Upload result:", result);

      resetPendingUpload();
      refreshDashboard();
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
  const ageGroupChartData = ageGroupData.map((item) => ({
    label: item.age_group,
    count: item.count,
  }));
  const ethnicityChartData = ethnicityData.map((item) => ({
    label: item.ethnicity,
    count: item.count,
  }));
  const businessImpact = overview ? overview.hours_logged * 30 : null;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const overviewResponse = await apiFetch("/api/overview");

        await requireOk(overviewResponse, "Failed to fetch overview data.");

        const overviewJson: OverviewData = await overviewResponse.json();
        setOverview(overviewJson);

        const lineChartResponse = await apiFetch("/api/charts/last-activity-by-month");

        await requireOk(lineChartResponse, "Failed to fetch line chart data.");

        const lineChartData: LastActivityPoint[] = await lineChartResponse.json();
        setLastActivityData(lineChartData);

        const genderChartResponse = await apiFetch(`/api/charts/volunteers-by-gender?start=${genderStartMonth}&end=${genderEndMonth}`);

        await requireOk(genderChartResponse, "Failed to fetch gender chart data.");

        const genderChartData: GenderBreakdownPoint[] = await genderChartResponse.json();
        setGenderData(genderChartData);

        const cityChartResponse = await apiFetch("/api/charts/volunteers-by-city");

        await requireOk(cityChartResponse, "Failed to fetch city chart data.");

        const cityChartData: CityBreakdownPoint[] = await cityChartResponse.json();
        setCityData(cityChartData);

        const ageGroupChartResponse = await apiFetch("/api/charts/volunteers-by-age-group");

        await requireOk(ageGroupChartResponse, "Failed to fetch age group chart data.");

        const ageGroupChartData: AgeGroupBreakdownPoint[] = await ageGroupChartResponse.json();
        setAgeGroupData(ageGroupChartData);

        const ethnicityChartResponse = await apiFetch("/api/charts/volunteers-by-ethnicity");

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
  }, [genderStartMonth, genderEndMonth, dashboardRefreshToken]);

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
          <DashboardStatCard title="Business Impact" value={businessImpact !== null ? `$${businessImpact.toLocaleString()}` : "--"} icon={DollarSign} iconColor="bg-emerald-600" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ChartPanel
            title="Last Activity by Month"
            description="Number of volunteers grouped by their most recent recorded activity month."
            loading={loading}
            isEmpty={filteredLastActivityData.length === 0}
            emptyMessage="No last activity dates are available for the current filters."
            controls={(
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
            )}
          >

            <LastActivityChart data={filteredLastActivityData} chartType={lastActivityChartType} />
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
