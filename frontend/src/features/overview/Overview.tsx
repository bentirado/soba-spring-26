import { useEffect, useRef, useState } from "react";
import { Chatbot } from "@/components/Chatbot";
import LastActivityChart from "@/components/LastActivityChart";
import VolunteersByCityBarChart from "@/components/VolunteersByCityBarChart";
import VolunteersByGenderPieChart from "@/components/VolunteersByGenderPieChart";
import * as XLSX from "xlsx";
import { StatCard } from "@/components/shared/StatCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TrendingUp, FileText, ChevronDown, UserCheck, Clock3, UserPlus } from "lucide-react";
// Recharts chart components are used inside dedicated chart components; no direct imports needed here.

// Note: exhibition and demographic datasets were moved to the Exhibitions feature.


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

export function Overview() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dataActionsRef = useRef<HTMLDivElement | null>(null);
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [pendingUploadRows, setPendingUploadRows] = useState<SpreadsheetRow[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [dataActionsOpen, setDataActionsOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  

  const [selectedRange, setSelectedRange] = useState("Last 30 Days");
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

  // AI assistant action placeholder (not used in this view currently)
  
  const handleFileChange = async (event: any) => {
    const file = event.target?.files?.[0];
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
      setSelectedFileName(file?.name ?? "");
      setPendingUploadRows([]);
      setIsUploadDialogOpen(true);
      console.error("Failed to parse uploaded spreadsheet:", error);
      setUploadErrorMessage("We couldn't read that spreadsheet. Please try another file.");
    } finally {
      // Clear input value so the same file can be re-selected if needed
      if (event.target) (event.target as HTMLInputElement).value = "";
    }
  };

  const handleUploadSave = () => {
    console.log("Selected file:", selectedFileName);
    console.log("Parsed spreadsheet data:", pendingUploadRows);
    console.table(pendingUploadRows);
    resetPendingUpload();
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
  }, [apiBaseUrl, genderStartMonth, genderEndMonth]);

  

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
              disabled={Boolean(uploadErrorMessage)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main stats (top small cards removed by request) */}

      {/* API-backed dashboard content */}
      <div className="space-y-6">
        {loading && <p className="text-sm text-slate-600">Loading dashboard...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Volunteers" value={overview?.total_volunteers ?? "--"} icon={Users} iconColor="bg-blue-600" />
          <StatCard title="Hours Logged" value={overview?.hours_logged ?? "--"} icon={Clock3} iconColor="bg-orange-500" />
          <StatCard title="Average Age" value={overview?.average_age ?? "--"} icon={UserPlus} iconColor="bg-green-600" />
          <StatCard title="Cities Represented" value={overview?.cities_represented ?? "--"} icon={TrendingUp} iconColor="bg-blue-600" />
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

      {/* Volunteer Engagement Trends and Weekly Activity cards moved to Volunteers page */}

      {/* Exhibitions and visitor demographics moved to the Exhibitions page */}

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
