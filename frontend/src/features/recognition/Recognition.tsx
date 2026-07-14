import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, Clock3, Loader2, Medal, Trophy, Users } from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";

type Volunteer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  city: string | null;
  state: string;
  is_active: boolean;
  life_hours: number | null;
};

type RankedVolunteer = Volunteer & {
  rank: number;
  name: string;
  hours: number;
  initials: string;
};

const rankStyles = {
  1: {
    badgeBg: "bg-yellow-100",
    badgeText: "text-amber-700",
    ring: "border-yellow-400",
    podiumBg: "bg-yellow-50",
    podiumText: "text-yellow-500",
    podiumHeight: "h-32",
    iconBg: "bg-yellow-100",
    iconText: "text-amber-500",
  },
  2: {
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    ring: "border-slate-300",
    podiumBg: "bg-slate-100",
    podiumText: "text-slate-400",
    podiumHeight: "h-24",
    iconBg: "bg-slate-100",
    iconText: "text-slate-500",
  },
  3: {
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    ring: "border-orange-300",
    podiumBg: "bg-orange-50",
    podiumText: "text-orange-400",
    podiumHeight: "h-20",
    iconBg: "bg-orange-50",
    iconText: "text-orange-400",
  },
} as const;

const milestones = [
  { label: "Century Club", threshold: 100, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Community Pillars", threshold: 50, icon: Medal, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "First Ten Hours", threshold: 10, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
];

function getInitials(firstName: string, lastName: string) {
  const firstInitial = firstName.trim().charAt(0).toUpperCase();
  const lastInitial = lastName.trim().charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`.trim();
}

function rankVolunteers(volunteers: Volunteer[]) {
  return volunteers
    .filter((volunteer) => typeof volunteer.life_hours === "number")
    .sort((a, b) => (b.life_hours ?? 0) - (a.life_hours ?? 0))
    .map((volunteer, index): RankedVolunteer => ({
      ...volunteer,
      rank: index + 1,
      name: `${volunteer.first_name} ${volunteer.last_name}`.trim(),
      hours: volunteer.life_hours ?? 0,
      initials: getInitials(volunteer.first_name, volunteer.last_name),
    }));
}

export function Recognition() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const podium = rankedVolunteers.slice(0, 3).sort((a, b) => {
    const podiumOrder = [2, 1, 3];
    return podiumOrder.indexOf(a.rank) - podiumOrder.indexOf(b.rank);
  });
  const topTen = rankedVolunteers.slice(0, 10);
  const totalHours = volunteers.reduce((sum, volunteer) => sum + (volunteer.life_hours ?? 0), 0);
  const activeWithHours = volunteers.filter((volunteer) => volunteer.is_active && (volunteer.life_hours ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-semibold text-gray-900">Recognition</h1>
        </div>
        <p className="text-sm text-gray-500">
          Highlight volunteer contributions using lifetime hours from the volunteer database.
        </p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Total Recognized Hours</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Active Volunteers With Hours</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : activeWithHours}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Medal className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Top Contributor</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "--" : rankedVolunteers[0]?.name ?? "—"}</p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Volunteer Hall of Fame</h2>
          <p className="mt-1 text-sm text-gray-500">Top contributors ranked by lifetime hours</p>
        </div>

        {!loading && !error && podium.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            No volunteers with recorded hours yet.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {podium.map((person) => {
                const style = rankStyles[person.rank as 1 | 2 | 3];
                return (
                  <div
                    key={person.id}
                    className={`flex flex-col items-center text-center ${person.rank === 1 ? "md:-mt-6" : ""}`}
                  >
                    <div
                      className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 ${style.ring} ${style.badgeBg} text-4xl font-bold ${style.badgeText}`}
                    >
                      {person.initials}
                    </div>

                    <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${style.iconBg}`}>
                      <Trophy className={`h-5 w-5 ${style.iconText}`} />
                    </div>

                    <p className="text-xl font-semibold text-gray-900">{person.name}</p>
                    <p className="mb-4 text-2xl font-semibold text-emerald-600">
                      {person.hours.toFixed(1)} hrs
                    </p>

                    <div
                      className={`flex w-24 items-center justify-center rounded-t-xl border border-gray-200 md:w-28 ${style.podiumBg} ${style.podiumHeight}`}
                    >
                      <span className={`text-4xl font-bold md:text-5xl ${style.podiumText}`}>
                        {person.rank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {milestones.map((milestone) => {
          const count = volunteers.filter((volunteer) => (volunteer.life_hours ?? 0) >= milestone.threshold).length;
          const Icon = milestone.icon;
          return (
            <div key={milestone.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${milestone.bg} ${milestone.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold text-gray-900">{milestone.label}</p>
              <p className="mt-1 text-sm text-gray-500">{milestone.threshold}+ lifetime hours</p>
              <p className="mt-4 text-2xl font-semibold text-gray-900">{loading ? "--" : count}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Top Contributors</h2>
          <p className="text-sm text-gray-500">The first ten volunteer records ranked by lifetime hours.</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Volunteer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hours</th>
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
                      <div className="text-xs text-gray-500">{volunteer.email || "No email"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[volunteer.city, volunteer.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${volunteer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {volunteer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{volunteer.hours.toFixed(1)}</td>
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
