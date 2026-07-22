import { useEffect, useRef, useState, type ReactNode } from "react";
import LastActivityChart from "@/components/LastActivityChart";
import DashboardStatCard from "@/components/StatCard";
import VolunteersByCityBarChart from "@/components/VolunteersByCityBarChart";
import VolunteersByGenderPieChart from "@/components/VolunteersByGenderPieChart";
import VolunteerBreakdownChart from "@/components/VolunteerBreakdownChart";
import { FileText, ChevronDown, Users, Clock3, Cake, MapPin, DollarSign, AlertCircle, Loader2, HelpCircle, Sparkles } from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";
import { generateInsight as generateAiInsight } from "@/lib/insights";

const rangeOptions = ["All Time", "Last 3 Years", "This Year", "This Quarter"];
const rangeParamByLabel: Record<string, string> = {
  "All Time": "all_time",
  "Last 3 Years": "last_3_years",
  "This Year": "this_year",
  "This Quarter": "this_quarter",
};
const defaultVolunteerHourlyValue = 30.63;
const lastActivityChartStorageKey = "lastActivityChartType";
const cityChartStorageKey = "cityChartType";
const genderChartStorageKey = "genderChartType";
const ageGroupChartStorageKey = "ageGroupChartType";
const ethnicityChartStorageKey = "ethnicityChartType";

type LastActivityChartType = "line" | "bar" | "area";
type CityChartType = "vertical" | "horizontal" | "pie";
type GenderChartType = "pie" | "bar" | "horizontal";
type BreakdownChartType = "pie" | "bar" | "horizontal";

const validLastActivityChartTypes: LastActivityChartType[] = ["bar", "line", "area"];
const validCityChartTypes: CityChartType[] = ["vertical", "horizontal", "pie"];
const validGenderChartTypes: GenderChartType[] = ["pie", "bar", "horizontal"];
const validBreakdownChartTypes: BreakdownChartType[] = ["pie", "bar", "horizontal"];
const reportMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const reportWeekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const reportAgeGroupOrder = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+", "Unknown"];

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

type ReportVolunteer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  age: number | null;
  age_group: string | null;
  gender: string | null;
  ethnicity: string | null;
  hispanic_latino: string | null;
  dietary_restrictions: string;
  joined_date?: string | null;
  last_activity: string | null;
  life_hours: number | null;
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

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadHtmlReport(fileName: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function renderReportRows(items: Array<Record<string, string | number>>) {
  if (items.length === 0) {
    return `<p class="muted">No data available.</p>`;
  }

  const headers = Object.keys(items[0]);

  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${items
          .map((item) => `
            <tr>
              ${headers.map((header) => `<td>${escapeHtml(item[header])}</td>`).join("")}
            </tr>
          `)
          .join("")}
      </tbody>
    </table>
  `;
}

function getReportVolunteerDisplayName(volunteer: ReportVolunteer) {
  if (volunteer.first_name === "Spreadsheet" && volunteer.last_name.startsWith("Row ")) {
    const rowNumber = Number(volunteer.last_name.replace("Row ", ""));
    return Number.isFinite(rowNumber) ? `Volunteer #${rowNumber.toString().padStart(3, "0")}` : "Volunteer";
  }

  return `${volunteer.first_name} ${volunteer.last_name}`.trim();
}

function getReportMonthIndex(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getMonth();
}

function getReportWeekdayIndex(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getDay();
}

function formatReportDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function hasReportValue(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value);
  return Boolean(value?.trim());
}

function getReportAgeGroup(volunteer: ReportVolunteer) {
  if (volunteer.age_group) return volunteer.age_group;
  if (volunteer.age == null) return "Unknown";
  if (volunteer.age < 18) return "Under 18";
  if (volunteer.age <= 24) return "18-24";
  if (volunteer.age <= 34) return "25-34";
  if (volunteer.age <= 44) return "35-44";
  if (volunteer.age <= 54) return "45-54";
  return "55+";
}

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
  const [genderChartType, setGenderChartType] = useState<GenderChartType>(() => {
    const savedType = window.localStorage.getItem(genderChartStorageKey) as GenderChartType | null;
    return savedType && validGenderChartTypes.includes(savedType) ? savedType : "pie";
  });
  const [cityChartType, setCityChartType] = useState<CityChartType>(() => {
    const savedType = window.localStorage.getItem(cityChartStorageKey) as CityChartType | null;
    return savedType && validCityChartTypes.includes(savedType) ? savedType : "vertical";
  });
  const [ageGroupChartType, setAgeGroupChartType] = useState<BreakdownChartType>(() => {
    const savedType = window.localStorage.getItem(ageGroupChartStorageKey) as BreakdownChartType | null;
    return savedType && validBreakdownChartTypes.includes(savedType) ? savedType : "bar";
  });
  const [ethnicityChartType, setEthnicityChartType] = useState<BreakdownChartType>(() => {
    const savedType = window.localStorage.getItem(ethnicityChartStorageKey) as BreakdownChartType | null;
    return savedType && validBreakdownChartTypes.includes(savedType) ? savedType : "horizontal";
  });
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [lastActivityInsightLoading, setLastActivityInsightLoading] = useState(false);
  const [generatedLastActivityInsight, setGeneratedLastActivityInsight] = useState("");
  const [cityInsightLoading, setCityInsightLoading] = useState(false);
  const [generatedCityInsight, setGeneratedCityInsight] = useState("");
  const [genderInsightLoading, setGenderInsightLoading] = useState(false);
  const [generatedGenderInsight, setGeneratedGenderInsight] = useState("");
  const [ageGroupInsightLoading, setAgeGroupInsightLoading] = useState(false);
  const [generatedAgeGroupInsight, setGeneratedAgeGroupInsight] = useState("");
  const [ethnicityInsightLoading, setEthnicityInsightLoading] = useState(false);
  const [generatedEthnicityInsight, setGeneratedEthnicityInsight] = useState("");
  const [reportGenerating, setReportGenerating] = useState(false);
  const [volunteerHourlyValue, setVolunteerHourlyValue] = useState(() => {
    const savedValue = window.localStorage.getItem("volunteerHourlyValue");
    const parsedValue = savedValue ? Number(savedValue) : defaultVolunteerHourlyValue;
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultVolunteerHourlyValue;
  });
  const [hourlyValueInput, setHourlyValueInput] = useState(volunteerHourlyValue.toString());

  const refreshDashboard = () => {
    setDashboardRefreshToken((currentValue) => currentValue + 1);
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

  const sortedCityData = [...cityData].sort((firstCity, secondCity) => {
    if (secondCity.count !== firstCity.count) {
      return secondCity.count - firstCity.count;
    }

    return firstCity.city.localeCompare(secondCity.city);
  });

  const topCity = sortedCityData[0] ?? null;
  const secondCity = sortedCityData[1] ?? null;
  const cityTotalVolunteers = sortedCityData.reduce((total, item) => total + item.count, 0);
  const topCityShare = topCity && cityTotalVolunteers > 0 ? Math.round((topCity.count / cityTotalVolunteers) * 100) : 0;
  const cityInsightMessages = topCity
    ? [
        `${topCity.city} is leading this view with ${topCity.count.toLocaleString()} volunteer${topCity.count === 1 ? "" : "s"}, representing about ${topCityShare}% of the city data shown here. That makes it the first place I would look when thinking about volunteer concentration.`,
        `The city breakdown is most concentrated in ${topCity.city}. With ${topCity.count.toLocaleString()} volunteer${topCity.count === 1 ? "" : "s"} there${secondCity ? `, compared with ${secondCity.count.toLocaleString()} in ${secondCity.city}` : ""}, it may be worth checking whether outreach, scheduling, or geography is driving that pattern.`,
        `The standout city in this range is ${topCity.city}. It accounts for roughly ${topCityShare}% of the volunteers represented in this chart, so it is probably an important anchor location for engagement planning.`,
        `I would call out ${topCity.city} as the strongest city signal here. ${topCity.count.toLocaleString()} volunteer${topCity.count === 1 ? " is" : "s are"} associated with that city, which can help the client understand where their volunteer base is currently clustered.`,
        `This chart suggests the volunteer base is not evenly spread across cities. ${topCity.city} is the top contributor with ${topCity.count.toLocaleString()} volunteer${topCity.count === 1 ? "" : "s"}, so comparing it against nearby cities could reveal where future recruitment has the most room to grow.`,
      ]
    : [];

  const sortedGenderData = [...genderData].sort((firstGender, secondGender) => {
    if (secondGender.count !== firstGender.count) {
      return secondGender.count - firstGender.count;
    }

    return firstGender.gender.localeCompare(secondGender.gender);
  });

  const topGender = sortedGenderData[0] ?? null;
  const secondGender = sortedGenderData[1] ?? null;
  const genderTotalVolunteers = sortedGenderData.reduce((total, item) => total + item.count, 0);
  const topGenderShare = topGender && genderTotalVolunteers > 0 ? Math.round((topGender.count / genderTotalVolunteers) * 100) : 0;
  const genderInsightMessages = topGender
    ? [
        `${topGender.gender} is the largest gender group in this view, with ${topGender.count.toLocaleString()} volunteer${topGender.count === 1 ? "" : "s"} or about ${topGenderShare}% of the records shown. That gives the client a quick read on the current makeup of the dataset.`,
        `The gender breakdown is led by ${topGender.gender}. ${topGender.count.toLocaleString()} volunteer${topGender.count === 1 ? " is" : "s are"} in that group${secondGender ? `, compared with ${secondGender.count.toLocaleString()} in ${secondGender.gender}` : ""}, which is useful context when reviewing representation across the volunteer base.`,
        `The main pattern here is that ${topGender.gender} represents the strongest category in the selected range. At roughly ${topGenderShare}% of the chart, it may be worth comparing this against the museum's expectations or recruitment goals.`,
        `I would call out ${topGender.gender} as the clearest signal in this chart. With ${topGender.count.toLocaleString()} volunteer${topGender.count === 1 ? "" : "s"}, it is the first category to review when talking about volunteer demographics.`,
        `This chart suggests the gender distribution is currently weighted toward ${topGender.gender}. That group accounts for about ${topGenderShare}% of the volunteers shown, so it can help frame a broader conversation about outreach and inclusion.`,
      ]
    : [];

  const ageGroupChartData = ageGroupData.map((item) => ({
    label: item.age_group,
    count: item.count,
  }));
  const sortedAgeGroupData = [...ageGroupChartData].sort((firstGroup, secondGroup) => {
    if (secondGroup.count !== firstGroup.count) {
      return secondGroup.count - firstGroup.count;
    }

    return firstGroup.label.localeCompare(secondGroup.label);
  });
  const topAgeGroup = sortedAgeGroupData[0] ?? null;
  const secondAgeGroup = sortedAgeGroupData[1] ?? null;
  const ageGroupTotalVolunteers = sortedAgeGroupData.reduce((total, item) => total + item.count, 0);
  const topAgeGroupShare = topAgeGroup && ageGroupTotalVolunteers > 0 ? Math.round((topAgeGroup.count / ageGroupTotalVolunteers) * 100) : 0;
  const ageGroupInsightMessages = topAgeGroup
    ? [
        `${topAgeGroup.label} is the largest age group in this view, with ${topAgeGroup.count.toLocaleString()} volunteer${topAgeGroup.count === 1 ? "" : "s"} or about ${topAgeGroupShare}% of the records shown. That makes it a useful starting point for understanding who is most represented in the current dataset.`,
        `The age distribution is led by ${topAgeGroup.label}. ${topAgeGroup.count.toLocaleString()} volunteer${topAgeGroup.count === 1 ? " falls" : "s fall"} into that group${secondAgeGroup ? `, compared with ${secondAgeGroup.count.toLocaleString()} in ${secondAgeGroup.label}` : ""}, which can help frame recruitment and retention conversations.`,
        `The clearest age-group signal here is ${topAgeGroup.label}. Since that group makes up roughly ${topAgeGroupShare}% of this chart, it may be worth comparing against the museum's ideal volunteer mix.`,
        `I would call out ${topAgeGroup.label} as the strongest age-group category. With ${topAgeGroup.count.toLocaleString()} volunteer${topAgeGroup.count === 1 ? "" : "s"}, it gives the client a quick sense of where participation is currently concentrated.`,
        `This chart suggests the volunteer base is weighted most heavily toward ${topAgeGroup.label}. That group represents about ${topAgeGroupShare}% of the volunteers shown, which could be useful when planning outreach, scheduling, or role design.`,
      ]
    : [];
  const ethnicityChartData = ethnicityData.map((item) => ({
    label: item.ethnicity,
    count: item.count,
  }));
  const sortedEthnicityData = [...ethnicityChartData].sort((firstGroup, secondGroup) => {
    if (secondGroup.count !== firstGroup.count) {
      return secondGroup.count - firstGroup.count;
    }

    return firstGroup.label.localeCompare(secondGroup.label);
  });
  const topEthnicity = sortedEthnicityData[0] ?? null;
  const secondEthnicity = sortedEthnicityData[1] ?? null;
  const ethnicityTotalVolunteers = sortedEthnicityData.reduce((total, item) => total + item.count, 0);
  const topEthnicityShare = topEthnicity && ethnicityTotalVolunteers > 0 ? Math.round((topEthnicity.count / ethnicityTotalVolunteers) * 100) : 0;
  const ethnicityInsightMessages = topEthnicity
    ? [
        `${topEthnicity.label} is the largest ethnicity group in this view, with ${topEthnicity.count.toLocaleString()} volunteer${topEthnicity.count === 1 ? "" : "s"} or about ${topEthnicityShare}% of the records shown. That gives the client a quick read on the current demographic mix.`,
        `The ethnicity breakdown is led by ${topEthnicity.label}. ${topEthnicity.count.toLocaleString()} volunteer${topEthnicity.count === 1 ? " is" : "s are"} in that group${secondEthnicity ? `, compared with ${secondEthnicity.count.toLocaleString()} in ${secondEthnicity.label}` : ""}, which can help frame representation conversations.`,
        `The clearest ethnicity signal here is ${topEthnicity.label}. Since that group makes up roughly ${topEthnicityShare}% of this chart, it may be worth comparing the data against the museum's outreach and inclusion goals.`,
        `I would call out ${topEthnicity.label} as the strongest category in this chart. With ${topEthnicity.count.toLocaleString()} volunteer${topEthnicity.count === 1 ? "" : "s"}, it is the first group to review when discussing demographic representation.`,
        `This chart suggests the ethnicity distribution is currently weighted toward ${topEthnicity.label}. That group represents about ${topEthnicityShare}% of the volunteers shown, which can help the client identify where future outreach may need more attention.`,
      ]
    : [];
  const estimatedValue = overview ? overview.hours_logged * volunteerHourlyValue : null;
  const selectedRangeParam = rangeParamByLabel[selectedRange] ?? "all_time";

  const handleGenerateReportClick = async () => {
    if (!overview || loading || reportGenerating) {
      return;
    }

    try {
      setReportGenerating(true);
      setError("");

      const volunteersResponse = await apiFetch("/api/volunteers");
      await requireOk(volunteersResponse, "Failed to fetch volunteer dataset for report.");
      const reportVolunteers = (await volunteersResponse.json()) as ReportVolunteer[];

      const generatedAt = new Date();
      const generatedDate = generatedAt.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
      const generatedTime = generatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const fileDate = generatedAt.toISOString().slice(0, 10);
      const currentYear = generatedAt.getFullYear();
      const previousYear = currentYear - 1;
      const totalReportHours = reportVolunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);
      const averageReportHours = reportVolunteers.length ? totalReportHours / reportVolunteers.length : 0;
      const volunteersWithHours = reportVolunteers.filter((volunteer) => (volunteer.life_hours ?? 0) > 0).length;
      const hundredHourVolunteers = reportVolunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= 100).length;
      const fiftyHourVolunteers = reportVolunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= 50).length;
      const tenHourVolunteers = reportVolunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= 10).length;
      const mostRecentActivity = reportVolunteers.reduce<string | null>((latestDate, volunteer) => {
        if (!volunteer.last_activity) return latestDate;
        if (!latestDate) return volunteer.last_activity;
        return volunteer.last_activity > latestDate ? volunteer.last_activity : latestDate;
      }, null);
      const completionFields = reportVolunteers.flatMap((volunteer) => [
        volunteer.city,
        volunteer.state,
        volunteer.zip,
        volunteer.age,
        volunteer.gender,
        volunteer.ethnicity,
        volunteer.life_hours,
        volunteer.last_activity,
      ]);
      const completionPercent = completionFields.length
        ? Math.round((completionFields.filter(hasReportValue).length / completionFields.length) * 100)
        : 0;
      const reportActivityByMonth = reportMonthLabels.map((monthLabel, monthIndex) => {
        const matchingVolunteers = reportVolunteers.filter((volunteer) => getReportMonthIndex(volunteer.last_activity) === monthIndex);
        return {
          Month: monthLabel,
          Volunteers: matchingVolunteers.length,
          Hours: Number(matchingVolunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0).toFixed(1)),
        };
      });
      const reportYearComparison = reportMonthLabels.map((monthLabel, monthIndex) => {
        const currentYearHours = reportVolunteers.reduce((sum, volunteer) => {
          if (!volunteer.last_activity) return sum;
          const activityDate = new Date(`${volunteer.last_activity}T00:00:00`);
          if (Number.isNaN(activityDate.getTime())) return sum;
          return activityDate.getFullYear() === currentYear && activityDate.getMonth() === monthIndex
            ? sum + (volunteer.life_hours ?? 0)
            : sum;
        }, 0);
        const previousYearHours = reportVolunteers.reduce((sum, volunteer) => {
          if (!volunteer.last_activity) return sum;
          const activityDate = new Date(`${volunteer.last_activity}T00:00:00`);
          if (Number.isNaN(activityDate.getTime())) return sum;
          return activityDate.getFullYear() === previousYear && activityDate.getMonth() === monthIndex
            ? sum + (volunteer.life_hours ?? 0)
            : sum;
        }, 0);

        return {
          Month: monthLabel,
          [currentYear.toString()]: Number(currentYearHours.toFixed(1)),
          [previousYear.toString()]: Number(previousYearHours.toFixed(1)),
        };
      });
      const reportWeekdayData = reportWeekdayLabels.map((dayLabel, dayIndex) => {
        const matchingVolunteers = reportVolunteers.filter((volunteer) => getReportWeekdayIndex(volunteer.last_activity) === dayIndex);
        const participation = reportVolunteers.length ? Math.round((matchingVolunteers.length / reportVolunteers.length) * 100) : 0;

        return {
          Day: dayLabel,
          Volunteers: matchingVolunteers.length,
          Hours: Number(matchingVolunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0).toFixed(1)),
          "Participation %": participation,
        };
      });
      const reportAgeDistribution = reportAgeGroupOrder.map((ageGroup) => ({
        "Age Group": ageGroup,
        Volunteers: reportVolunteers.filter((volunteer) => getReportAgeGroup(volunteer) === ageGroup).length,
      }));
      const rankedReportVolunteers = reportVolunteers
        .filter((volunteer) => (volunteer.life_hours ?? 0) > 0)
        .sort((firstVolunteer, secondVolunteer) => (secondVolunteer.life_hours ?? 0) - (firstVolunteer.life_hours ?? 0))
        .map((volunteer, index) => {
          const hours = volunteer.life_hours ?? 0;
          return {
            ...volunteer,
            Rank: index + 1,
            Volunteer: getReportVolunteerDisplayName(volunteer),
            Location: [volunteer.city, volunteer.state].filter(Boolean).join(", ") || "-",
            Hours: Number(hours.toFixed(1)),
            "Hour Share": totalReportHours ? `${Math.round((hours / totalReportHours) * 100)}%` : "0%",
          };
        });
      const contributionTiers = [
        { Tier: "100+ hrs", Min: 100, Max: Number.POSITIVE_INFINITY },
        { Tier: "50-99 hrs", Min: 50, Max: 100 },
        { Tier: "10-49 hrs", Min: 10, Max: 50 },
        { Tier: "1-9 hrs", Min: 1, Max: 10 },
        { Tier: "0 hrs", Min: 0, Max: 1 },
      ].map((tier) => ({
        Tier: tier.Tier,
        Volunteers: reportVolunteers.filter((volunteer) => {
          const hours = volunteer.life_hours ?? 0;
          return hours >= tier.Min && hours < tier.Max;
        }).length,
      }));
      const topContributor = rankedReportVolunteers[0] ?? null;
      const reportHighlights = [
        busiestLastActivityMonth
          ? `Recent activity is most concentrated in ${busiestLastActivityMonth.month}, with ${busiestLastActivityMonth.count.toLocaleString()} volunteer${busiestLastActivityMonth.count === 1 ? "" : "s"}.`
          : "No recent-activity month data is available for this range.",
        topCity
          ? `${topCity.city} is the leading city, representing about ${topCityShare}% of city records in this range.`
          : "No city breakdown is available for this range.",
        topGender
          ? `${topGender.gender} is the largest gender category at about ${topGenderShare}% of gender records.`
          : "No gender breakdown is available for this range.",
        topAgeGroup
          ? `${topAgeGroup.label} is the largest age group at about ${topAgeGroupShare}% of age-group records.`
          : "No age-group breakdown is available for this range.",
        topEthnicity
          ? `${topEthnicity.label} is the largest ethnicity category at about ${topEthnicityShare}% of ethnicity records.`
          : "No ethnicity breakdown is available for this range.",
        topContributor
          ? `${topContributor.Volunteer} leads recognition with ${topContributor.Hours.toLocaleString()} lifetime hours.`
          : "No volunteer records currently have lifetime hours for recognition ranking.",
        `The active uploaded dataset is ${completionPercent}% complete across key report fields.`,
      ];
      const reportHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Science Museum Oklahoma Comprehensive Volunteer Report</title>
    <style>
      body { color: #0f172a; font-family: Arial, sans-serif; margin: 40px; line-height: 1.45; }
      h1 { font-size: 28px; margin: 0 0 4px; }
      h2 { border-bottom: 1px solid #e2e8f0; font-size: 18px; margin: 28px 0 12px; padding-bottom: 8px; }
      h3 { font-size: 15px; margin: 22px 0 8px; }
      .muted { color: #64748b; }
      .summary { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); margin: 24px 0; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
      .label { color: #64748b; font-size: 12px; margin-bottom: 6px; }
      .value { font-size: 20px; font-weight: 700; }
      ul { padding-left: 20px; }
      table { border-collapse: collapse; margin-top: 8px; width: 100%; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 9px 8px; text-align: left; }
      th { background: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; }
      @media print {
        body { margin: 24px; }
        .summary { grid-template-columns: repeat(2, 1fr); }
      }
    </style>
  </head>
  <body>
    <h1>Science Museum Oklahoma Comprehensive Volunteer Report</h1>
    <p class="muted">Generated ${escapeHtml(generatedDate)} at ${escapeHtml(generatedTime)}. Overview range: ${escapeHtml(selectedRange)}. Volunteer and recognition sections use the full active uploaded spreadsheet.</p>

    <section class="summary">
      <div class="card"><div class="label">Total Volunteers</div><div class="value">${overview.total_volunteers.toLocaleString()}</div></div>
      <div class="card"><div class="label">Hours Logged</div><div class="value">${overview.hours_logged.toLocaleString()}</div></div>
      <div class="card"><div class="label">Average Age</div><div class="value">${overview.average_age.toLocaleString()}</div></div>
      <div class="card"><div class="label">Cities Represented</div><div class="value">${overview.cities_represented.toLocaleString()}</div></div>
      <div class="card"><div class="label">Estimated Value</div><div class="value">${estimatedValue !== null ? `$${Math.round(estimatedValue).toLocaleString()}` : "-"}</div></div>
      <div class="card"><div class="label">Dataset Completion</div><div class="value">${completionPercent}%</div></div>
      <div class="card"><div class="label">Volunteers With Hours</div><div class="value">${volunteersWithHours.toLocaleString()}</div></div>
      <div class="card"><div class="label">Latest Activity</div><div class="value">${escapeHtml(formatReportDate(mostRecentActivity))}</div></div>
    </section>

    <h2>Highlights</h2>
    <ul>${reportHighlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul>

    <h2>Overview Dashboard Breakdown</h2>
    <h3>Recent Volunteer Activity</h3>
    ${renderReportRows(chronologicalLastActivityData.map((item) => ({ Month: item.month, Volunteers: item.count })))}

    <h3>Top Cities</h3>
    ${renderReportRows(sortedCityData.slice(0, 10).map((item) => ({ City: item.city, Volunteers: item.count })))}

    <h3>Gender Breakdown</h3>
    ${renderReportRows(sortedGenderData.map((item) => ({ Gender: item.gender, Volunteers: item.count })))}

    <h3>Age Group Breakdown</h3>
    ${renderReportRows(ageGroupChartData.map((item) => ({ "Age Group": item.label, Volunteers: item.count })))}

    <h3>Ethnicity Breakdown</h3>
    ${renderReportRows(sortedEthnicityData.map((item) => ({ Ethnicity: item.label, Volunteers: item.count })))}

    <h2>Volunteer Dataset Explorer</h2>
    ${renderReportRows([
      { Metric: "Volunteer Count", Value: reportVolunteers.length.toLocaleString() },
      { Metric: "Total Hours", Value: totalReportHours.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
      { Metric: "Average Hours Per Volunteer", Value: `${averageReportHours.toFixed(1)} hrs` },
      { Metric: "Data Completion", Value: `${completionPercent}%` },
      { Metric: "Latest Activity", Value: formatReportDate(mostRecentActivity) },
    ])}

    <h3>Last Activity by Month</h3>
    ${renderReportRows(reportActivityByMonth)}

    <h3>Activity Hours by Year</h3>
    ${renderReportRows(reportYearComparison)}

    <h3>Last Activity by Weekday</h3>
    ${renderReportRows(reportWeekdayData)}

    <h3>Age Distribution</h3>
    ${renderReportRows(reportAgeDistribution)}

    <h2>Recognition and Contribution Analytics</h2>
    ${renderReportRows([
      { Metric: "Total Hours", Value: totalReportHours.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
      { Metric: "Volunteers With Hours", Value: volunteersWithHours.toLocaleString() },
      { Metric: "Average Hours", Value: `${averageReportHours.toFixed(1)} hrs` },
      { Metric: "100+ Hour Volunteers", Value: hundredHourVolunteers.toLocaleString() },
      { Metric: "50+ Hour Volunteers", Value: fiftyHourVolunteers.toLocaleString() },
      { Metric: "10+ Hour Volunteers", Value: tenHourVolunteers.toLocaleString() },
    ])}

    <h3>Top Hour Contributors</h3>
    ${renderReportRows(rankedReportVolunteers.slice(0, 10).map((volunteer) => ({
      Rank: volunteer.Rank,
      Volunteer: volunteer.Volunteer,
      Location: volunteer.Location,
      Hours: volunteer.Hours,
      "Hour Share": volunteer["Hour Share"],
    })))}

    <h3>Contribution Tiers</h3>
    ${renderReportRows(contributionTiers)}

    <h2>Report Notes</h2>
    <ul>
      <li>${escapeHtml("Volunteer and recognition analytics are generated from the active uploaded spreadsheet dataset.")}</li>
      <li>${escapeHtml("Volunteer labels are anonymized because the current spreadsheet does not include names.")}</li>
      <li>${escapeHtml(`Estimated business value uses $${volunteerHourlyValue.toLocaleString()}/hr. Default based on Oklahoma volunteer time valuation.`)}</li>
    </ul>
  </body>
</html>`;

      downloadHtmlReport(`smo-volunteer-dashboard-report-${selectedRangeParam}-${fileDate}.html`, reportHtml);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not generate report: ${err.message}`
          : "Could not generate report.",
      );
    } finally {
      setReportGenerating(false);
    }
  };

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

  const updateCityChartType = (nextType: CityChartType) => {
    setCityChartType(nextType);
    window.localStorage.setItem(cityChartStorageKey, nextType);
  };

  const updateGenderChartType = (nextType: GenderChartType) => {
    setGenderChartType(nextType);
    window.localStorage.setItem(genderChartStorageKey, nextType);
  };

  const updateAgeGroupChartType = (nextType: BreakdownChartType) => {
    setAgeGroupChartType(nextType);
    window.localStorage.setItem(ageGroupChartStorageKey, nextType);
  };

  const updateEthnicityChartType = (nextType: BreakdownChartType) => {
    setEthnicityChartType(nextType);
    window.localStorage.setItem(ethnicityChartStorageKey, nextType);
  };

  const generateLastActivityInsight = async () => {
    if (chronologicalLastActivityData.length === 0 || lastActivityInsightLoading) {
      return;
    }

    setGeneratedLastActivityInsight("");
    setLastActivityInsightLoading(true);

    try {
      const insight = await generateAiInsight({
        page: "Overview",
        subject: "Recent Volunteer Activity",
        context: `Selected range: ${selectedRange}. Volunteers grouped by the month of their most recent recorded activity.`,
        data: chronologicalLastActivityData,
      });
      setGeneratedLastActivityInsight(insight);
    } catch (err) {
      setGeneratedLastActivityInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setLastActivityInsightLoading(false);
    }
  };

  const generateCityInsight = async () => {
    if (sortedCityData.length === 0 || cityInsightLoading) {
      return;
    }

    setGeneratedCityInsight("");
    setCityInsightLoading(true);

    try {
      const insight = await generateAiInsight({
        page: "Overview",
        subject: "Volunteers by City",
        context: `Selected range: ${selectedRange}. City names are standardized for charting; focus on distribution and concentration.`,
        data: sortedCityData,
      });
      setGeneratedCityInsight(insight);
    } catch (err) {
      setGeneratedCityInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setCityInsightLoading(false);
    }
  };

  const generateGenderInsight = async () => {
    if (sortedGenderData.length === 0 || genderInsightLoading) {
      return;
    }

    setGeneratedGenderInsight("");
    setGenderInsightLoading(true);

    try {
      const insight = await generateAiInsight({
        page: "Overview",
        subject: "Volunteers by Gender",
        context: `Selected range: ${selectedRange}. Explain the highest-level demographic pattern without making assumptions about cause.`,
        data: sortedGenderData,
      });
      setGeneratedGenderInsight(insight);
    } catch (err) {
      setGeneratedGenderInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setGenderInsightLoading(false);
    }
  };

  const generateAgeGroupInsight = async () => {
    if (ageGroupChartData.length === 0 || ageGroupInsightLoading) {
      return;
    }

    setGeneratedAgeGroupInsight("");
    setAgeGroupInsightLoading(true);

    try {
      const insight = await generateAiInsight({
        page: "Overview",
        subject: "Volunteers by Age Group",
        context: `Selected range: ${selectedRange}. Explain representation across age groups in a careful, client-ready way.`,
        data: ageGroupChartData,
      });
      setGeneratedAgeGroupInsight(insight);
    } catch (err) {
      setGeneratedAgeGroupInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setAgeGroupInsightLoading(false);
    }
  };

  const generateEthnicityInsight = async () => {
    if (ethnicityChartData.length === 0 || ethnicityInsightLoading) {
      return;
    }

    setGeneratedEthnicityInsight("");
    setEthnicityInsightLoading(true);

    try {
      const insight = await generateAiInsight({
        page: "Overview",
        subject: "Volunteers by Ethnicity",
        context: `Selected range: ${selectedRange}. Discuss the distribution respectfully and avoid unsupported conclusions.`,
        data: ethnicityChartData,
      });
      setGeneratedEthnicityInsight(insight);
    } catch (err) {
      setGeneratedEthnicityInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setEthnicityInsightLoading(false);
    }
  };

  useEffect(() => {
    setGeneratedLastActivityInsight("");
    setLastActivityInsightLoading(false);
    setGeneratedCityInsight("");
    setCityInsightLoading(false);
    setGeneratedGenderInsight("");
    setGenderInsightLoading(false);
    setGeneratedAgeGroupInsight("");
    setAgeGroupInsightLoading(false);
    setGeneratedEthnicityInsight("");
    setEthnicityInsightLoading(false);
  }, [selectedRangeParam, lastActivityData]);

  useEffect(() => {
    setGeneratedCityInsight("");
    setCityInsightLoading(false);
  }, [selectedRangeParam, cityData]);

  useEffect(() => {
    setGeneratedGenderInsight("");
    setGenderInsightLoading(false);
  }, [selectedRangeParam, genderData]);

  useEffect(() => {
    setGeneratedAgeGroupInsight("");
    setAgeGroupInsightLoading(false);
  }, [selectedRangeParam, ageGroupData]);

  useEffect(() => {
    setGeneratedEthnicityInsight("");
    setEthnicityInsightLoading(false);
  }, [selectedRangeParam, ethnicityData]);

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

        const genderChartResponse = await apiFetch(`/api/charts/volunteers-by-gender?${rangeQuery}`);

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
  }, [selectedRangeParam, dashboardRefreshToken]);

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
              disabled={loading || !overview || reportGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {reportGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {reportGenerating ? "Generating..." : "Generate Report"}
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
          <DashboardStatCard title="Total Volunteers" value={overview?.total_volunteers ?? "--"} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <DashboardStatCard title="Hours Logged" value={overview?.hours_logged ?? "--"} icon={Clock3} iconColor="text-orange-500" iconBg="bg-orange-50" />
          <DashboardStatCard title="Average Age" value={overview?.average_age ?? "--"} icon={Cake} iconColor="text-purple-600" iconBg="bg-purple-50" />
          <DashboardStatCard title="Cities Represented" value={overview?.cities_represented ?? "--"} icon={MapPin} iconColor="text-green-600" iconBg="bg-green-50" />
          <DashboardStatCard
            title="Estimated Value"
            value={estimatedValue !== null ? `$${Math.round(estimatedValue).toLocaleString()}` : "--"}
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
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
                  {lastActivityInsightLoading ? "Generating..." : "AI"}
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
            description="Volunteer distribution grouped by city from the current dataset."
            loading={loading}
            isEmpty={sortedCityData.length === 0}
            emptyMessage="No city data is available yet."
            controls={(
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex max-w-xs flex-col">
                  <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                  <select
                    value={cityChartType}
                    onChange={(event) => updateCityChartType(event.target.value as CityChartType)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="vertical">Column Chart</option>
                    <option value="horizontal">Horizontal Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateCityInsight}
                  disabled={sortedCityData.length === 0 || cityInsightLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cityInsightLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {cityInsightLoading ? "Generating..." : "AI"}
                </button>
              </div>
            )}
          >
            {generatedCityInsight && (
              <p className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {generatedCityInsight}
              </p>
            )}
            <VolunteersByCityBarChart data={sortedCityData} chartType={cityChartType} />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Gender"
            description="Volunteer distribution grouped by gender from the current dataset."
            loading={loading}
            isEmpty={sortedGenderData.length === 0}
            emptyMessage="No gender data is available for the current filters."
            controls={(
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex max-w-xs flex-col">
                  <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                  <select
                    value={genderChartType}
                    onChange={(event) => updateGenderChartType(event.target.value as GenderChartType)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="pie">Pie Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="horizontal">Horizontal Bar Chart</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateGenderInsight}
                  disabled={sortedGenderData.length === 0 || genderInsightLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {genderInsightLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {genderInsightLoading ? "Generating..." : "AI"}
                </button>
              </div>
            )}
          >
            {generatedGenderInsight && (
              <p className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                {generatedGenderInsight}
              </p>
            )}
            <VolunteersByGenderPieChart data={sortedGenderData} chartType={genderChartType} />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Age Group"
            description="Volunteer distribution grouped by age range from the current dataset."
            loading={loading}
            isEmpty={ageGroupChartData.length === 0}
            emptyMessage="No age group data is available yet."
            controls={(
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex max-w-xs flex-col">
                  <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                  <select
                    value={ageGroupChartType}
                    onChange={(event) => updateAgeGroupChartType(event.target.value as BreakdownChartType)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="horizontal">Horizontal Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateAgeGroupInsight}
                  disabled={ageGroupChartData.length === 0 || ageGroupInsightLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ageGroupInsightLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {ageGroupInsightLoading ? "Generating..." : "AI"}
                </button>
              </div>
            )}
          >
            {generatedAgeGroupInsight && (
              <p className="mt-5 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                {generatedAgeGroupInsight}
              </p>
            )}
            <VolunteerBreakdownChart
              data={ageGroupChartData}
              chartType={ageGroupChartType}
              sortMode="preserve"
            />
          </ChartPanel>

          <ChartPanel
            title="Volunteers by Ethnicity"
            description="Volunteer distribution grouped by ethnicity from the current dataset."
            loading={loading}
            isEmpty={ethnicityChartData.length === 0}
            emptyMessage="No ethnicity data is available yet."
            controls={(
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex max-w-xs flex-col">
                  <label className="mb-1 text-sm font-medium text-slate-700">Chart Type</label>
                  <select
                    value={ethnicityChartType}
                    onChange={(event) => updateEthnicityChartType(event.target.value as BreakdownChartType)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="horizontal">Horizontal Bar Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateEthnicityInsight}
                  disabled={ethnicityChartData.length === 0 || ethnicityInsightLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ethnicityInsightLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {ethnicityInsightLoading ? "Generating..." : "AI"}
                </button>
              </div>
            )}
          >
            {generatedEthnicityInsight && (
              <p className="mt-5 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                {generatedEthnicityInsight}
              </p>
            )}
            <VolunteerBreakdownChart data={ethnicityChartData} chartType={ethnicityChartType} />
          </ChartPanel>
        </div>
      </div>

    </div>
  );
}
