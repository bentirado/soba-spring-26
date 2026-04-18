import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

type Volunteer = {
  id: number;
  first_name: string;
  last_name: string;
  life_hours: number | null;
};

type HallOfFameEntry = {
  id: number;
  rank: number;
  name: string;
  hours: number;
  initials: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
  podiumBg: string;
  podiumText: string;
  podiumHeight: string;
  iconBg: string;
  iconText: string;
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

function getInitials(firstName: string, lastName: string) {
  const firstInitial = firstName.trim().charAt(0).toUpperCase();
  const lastInitial = lastName.trim().charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`.trim();
}

function buildHallOfFameEntries(volunteers: Volunteer[]): HallOfFameEntry[] {
  const ranked = volunteers
    .filter((volunteer) => typeof volunteer.life_hours === "number")
    .sort((a, b) => (b.life_hours ?? 0) - (a.life_hours ?? 0))
    .slice(0, 3)
    .map((volunteer, index) => {
      const rank = index + 1 as 1 | 2 | 3;
      return {
        id: volunteer.id,
        rank,
        name: `${volunteer.first_name} ${volunteer.last_name}`.trim(),
        hours: volunteer.life_hours ?? 0,
        initials: getInitials(volunteer.first_name, volunteer.last_name),
        ...rankStyles[rank],
      };
    });

  return ranked.sort((a, b) => {
    const podiumOrder = [2, 1, 3];
    return podiumOrder.indexOf(a.rank) - podiumOrder.indexOf(b.rank);
  });
}

export function Recognition() {
  const [topThree, setTopThree] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVolunteers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/volunteers`);
        if (!response.ok) {
          throw new Error("Failed to load volunteers.");
        }

        const volunteers = (await response.json()) as Volunteer[];
        setTopThree(buildHallOfFameEntries(volunteers));
        setError("");
      } catch {
        setError("Could not load volunteer rankings.");
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteers();
  }, []);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Volunteer Hall of Fame
          </h1>
        </div>
        <p className="text-sm text-gray-500">Top contributors by lifetime hours</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Loading volunteer rankings...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : topThree.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No volunteers with recorded hours yet.
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex items-end justify-center gap-4 md:gap-8">
            {topThree.map((person) => (
              <div
                key={person.id}
                className={`flex flex-col items-center text-center ${
                  person.rank === 1 ? "md:-mt-6" : ""
                }`}
              >
                <div
                  className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 ${person.ring} ${person.badgeBg} text-4xl font-bold ${person.badgeText}`}
                >
                  {person.initials}
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${person.iconBg}`}
                  >
                    <Trophy className={`h-5 w-5 ${person.iconText}`} />
                  </div>
                </div>

                <p className="text-xl font-semibold text-gray-900">{person.name}</p>
                <p className="mb-4 text-2xl font-semibold text-emerald-600">
                  {person.hours.toFixed(1)} hrs
                </p>

                <div
                  className={`flex w-24 items-center justify-center rounded-t-xl border border-gray-200 md:w-28 ${person.podiumBg} ${person.podiumHeight}`}
                >
                  <span
                    className={`text-4xl font-bold md:text-5xl ${person.podiumText}`}
                  >
                    {person.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
