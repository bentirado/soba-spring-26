import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  Clock3,
  Loader2,
  Medal,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";
import { generateInsight as generateAiInsight } from "@/lib/insights";

type Volunteer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  city: string | null;
  state: string;
  life_hours: number | null;
};

type RankedVolunteer = Volunteer & {
  rank: number;
  name: string;
  hours: number;
  hourShare: number;
};

const milestoneCards = [
  { label: "100+ Hours", threshold: 100, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "50+ Hours", threshold: 50, icon: Medal, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "10+ Hours", threshold: 10, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
];

const contributionTiers = [
  { label: "100+ hrs", min: 100, max: Infinity, color: "bg-amber-500" },
  { label: "50-99 hrs", min: 50, max: 100, color: "bg-blue-500" },
  { label: "10-49 hrs", min: 10, max: 50, color: "bg-emerald-500" },
  { label: "1-9 hrs", min: 1, max: 10, color: "bg-slate-500" },
  { label: "0 hrs", min: 0, max: 1, color: "bg-slate-300" },
];

function getVolunteerDisplayName(volunteer: Volunteer) {
  if (volunteer.first_name === "Spreadsheet" && volunteer.last_name.startsWith("Row ")) {
    const rowNumber = Number(volunteer.last_name.replace("Row ", ""));
    return Number.isFinite(rowNumber) ? `Volunteer #${rowNumber.toString().padStart(3, "0")}` : "Volunteer";
  }

  return `${volunteer.first_name} ${volunteer.last_name}`.trim();
}

function rankVolunteers(volunteers: Volunteer[]) {
  const totalHours = volunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);

  return volunteers
    .filter((volunteer) => (volunteer.life_hours ?? 0) > 0)
    .sort((a, b) => (b.life_hours ?? 0) - (a.life_hours ?? 0))
    .map((volunteer, index): RankedVolunteer => {
      const hours = volunteer.life_hours ?? 0;
      return {
        ...volunteer,
        rank: index + 1,
        name: getVolunteerDisplayName(volunteer),
        hours,
        hourShare: totalHours ? Math.round((hours / totalHours) * 100) : 0,
      };
    });
}

export function Recognition() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [generatedInsight, setGeneratedInsight] = useState("");

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
          ? `Could not load recognition data: ${err.message}`
          : "Could not load recognition data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const rankedVolunteers = useMemo(() => rankVolunteers(volunteers), [volunteers]);
  const podium = rankedVolunteers.slice(0, 3);
  const topTen = rankedVolunteers.slice(0, 10);
  const totalHours = volunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);
  const volunteersWithHours = rankedVolunteers.length;
  const averageHours = volunteers.length ? totalHours / volunteers.length : 0;
  const topContributor = rankedVolunteers[0] ?? null;
  const hundredHourCount = volunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= 100).length;

  const tierData = contributionTiers.map((tier) => ({
    ...tier,
    count: volunteers.filter((volunteer) => {
      const hours = volunteer.life_hours ?? 0;
      return hours >= tier.min && hours < tier.max;
    }).length,
  }));
  const largestTier = tierData.reduce((current, next) => (next.count > current.count ? next : current), tierData[0]);

  const generateInsight = async () => {
    if (!topContributor || insightLoading) return;
    setGeneratedInsight("");
    setInsightLoading(true);
    try {
      const insight = await generateAiInsight({
        page: "Recognition",
        subject: "Contribution Analytics",
        context: "Analyze lifetime hours, top contributors, milestone groups, and contribution tiers from the active uploaded spreadsheet.",
        data: {
          totalHours,
          volunteersWithHours,
          averageHours: Number(averageHours.toFixed(1)),
          hundredHourCount,
          largestTier: { label: largestTier.label, count: largestTier.count },
          topContributors: topTen.map((volunteer) => ({
            rank: volunteer.rank,
            name: volunteer.name,
            hours: volunteer.hours,
            hourShare: volunteer.hourShare,
          })),
          tiers: tierData.map((tier) => ({ label: tier.label, count: tier.count })),
        },
      });
      setGeneratedInsight(insight);
    } catch (err) {
      setGeneratedInsight(err instanceof Error ? err.message : "Could not generate insight.");
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    setGeneratedInsight("");
    setInsightLoading(false);
  }, [volunteers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-semibold text-gray-900">Recognition</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Highlight contribution patterns using lifetime hours from the active uploaded spreadsheet.
          </p>
        </div>

        <button
          type="button"
          onClick={generateInsight}
          disabled={rankedVolunteers.length === 0 || insightLoading}
          className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:brightness-95"
        >
          {insightLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {insightLoading ? "Generating..." : "AI"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading recognition data...
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchVolunteers}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {generatedInsight && (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {generatedInsight}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Total Hours</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {loading ? "--" : totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Volunteers With Hours</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : volunteersWithHours.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Average Hours</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : `${averageHours.toFixed(1)} hrs`}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Medal className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">100+ Hour Volunteers</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : hundredHourCount.toLocaleString()}</p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Top Hour Contributors</h2>
          <p className="mt-1 text-sm text-gray-500">Top uploaded volunteer records ranked by lifetime hours.</p>
        </div>

        {!loading && !error && podium.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            No volunteers with recorded hours yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {podium.map((person) => (
              <div key={person.id} className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                    #{person.rank}
                  </span>
                  <Trophy className={`h-5 w-5 ${person.rank === 1 ? "text-amber-500" : "text-slate-400"}`} />
                </div>
                <p className="text-lg font-semibold text-gray-900">{person.name}</p>
                {person.email && <p className="text-xs text-gray-500">{person.email}</p>}
                <p className="mt-4 text-3xl font-semibold text-emerald-600">{person.hours.toFixed(1)}</p>
                <p className="mt-1 text-sm text-gray-500">lifetime hours</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Contribution Tiers</h2>
          <p className="mt-1 text-sm text-gray-500">How uploaded volunteers are distributed across hour ranges.</p>

          <div className="mt-6 space-y-4">
            {tierData.map((tier) => {
              const percent = volunteers.length ? Math.round((tier.count / volunteers.length) * 100) : 0;
              return (
                <div key={tier.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{tier.label}</span>
                    <span className="text-gray-500">{tier.count.toLocaleString()} volunteers</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${tier.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          {milestoneCards.map((milestone) => {
            const count = volunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= milestone.threshold).length;
            const Icon = milestone.icon;
            return (
              <div key={milestone.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${milestone.bg} ${milestone.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">{milestone.label}</p>
                    <p className="text-sm text-gray-500">Volunteers at or above this lifetime-hour threshold</p>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{loading ? "--" : count.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Ranked Hour Table</h2>
          <p className="text-sm text-gray-500">The first ten uploaded volunteer records ranked by lifetime hours.</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Volunteer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                    Loading rankings...
                  </td>
                </tr>
              ) : topTen.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                    No ranked volunteers yet.
                  </td>
                </tr>
              ) : (
                topTen.map((volunteer) => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">#{volunteer.rank}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{volunteer.name}</div>
                      {volunteer.email && <div className="text-xs text-gray-500">{volunteer.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[volunteer.city, volunteer.state].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{volunteer.hours.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-600">{volunteer.hourShare}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
