import {
  Award,
  CalendarHeart,
  Shield,
  Star,
  Sun,
  Zap,
  Coffee,
  Gift,
  Trophy,
} from "lucide-react";

const milestoneBadges = [
  {
    title: "Century Club",
    subtitle: "100+ lifetime hours",
    earnedBy: "42 vols",
    icon: Trophy,
    iconBg: "bg-yellow-50",
    iconText: "text-amber-500",
    border: "border-yellow-200",
  },
  {
    title: "One Year Strong",
    subtitle: "1 year anniversary",
    earnedBy: "85 vols",
    icon: CalendarHeart,
    iconBg: "bg-green-50",
    iconText: "text-emerald-500",
    border: "border-green-200",
  },
  {
    title: "Community Pillar",
    subtitle: "50+ events attended",
    earnedBy: "18 vols",
    icon: Shield,
    iconBg: "bg-blue-50",
    iconText: "text-blue-500",
    border: "border-blue-200",
  },
  {
    title: "Super Mentor",
    subtitle: "Trained 5+ newbies",
    earnedBy: "12 vols",
    icon: Star,
    iconBg: "bg-purple-50",
    iconText: "text-purple-500",
    border: "border-purple-200",
  },
];

const welcomeTreats = [
  {
    title: "First Shift",
    subtitle: "Completed orientation",
    icon: Sun,
    iconBg: "bg-orange-50",
    iconText: "text-orange-500",
    border: "border-orange-100",
  },
  {
    title: "Fast Starter",
    subtitle: "3 shifts in first month",
    icon: Zap,
    iconBg: "bg-yellow-50",
    iconText: "text-yellow-500",
    border: "border-yellow-100",
  },
  {
    title: "Coffee on Us",
    subtitle: "Virtual $5 gift card",
    icon: Coffee,
    iconBg: "bg-stone-50",
    iconText: "text-stone-500",
    border: "border-stone-200",
  },
  {
    title: "Welcome Swag",
    subtitle: "T-shirt dispatched",
    icon: Gift,
    iconBg: "bg-pink-50",
    iconText: "text-pink-500",
    border: "border-pink-100",
  },
];

const recentRecognition = [
  {
    initials: "SJ",
    name: "Sarah Jenkins",
    action: "earned the",
    badge: "Century Club",
    type: "badge",
    time: "2 hours ago",
    icon: Trophy,
    iconText: "text-amber-500",
  },
  {
    initials: "DK",
    name: "David Kim",
    action: "received",
    badge: "Coffee on Us",
    type: "reward",
    time: "5 hours ago",
    icon: Coffee,
    iconText: "text-stone-500",
  },
  {
    initials: "ER",
    name: "Elena Rodriguez",
    action: "earned the",
    badge: "Community Pillar",
    type: "badge",
    time: "1 day ago",
    icon: Shield,
    iconText: "text-blue-500",
  },
];

export function Recognition() {
  const handleCreateBadge = () => {
    console.log("Create new badge clicked");
  };

  const handleSendReward = (title: string) => {
    console.log(`Send clicked for ${title}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Recognition & Rewards
          </h1>
          <p className="text-sm text-gray-500">
            Manage badges, milestones, and virtual treats for your volunteers.
          </p>
        </div>

        <button
          onClick={handleCreateBadge}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2fb36f] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#26955c]"
        >
          <Award className="h-4 w-4" />
          Create New Badge
        </button>
      </div>

      {/* Milestone Badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Milestone Badges (Regulars)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4 md:grid-cols-2">
          {milestoneBadges.map((badge) => {
            const Icon = badge.icon;

            return (
              <div
                key={badge.title}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${badge.border}`}
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${badge.iconBg}`}
                >
                  <Icon className={`h-7 w-7 ${badge.iconText}`} />
                </div>

                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {badge.title}
                </h3>
                <p className="mb-6 text-sm text-gray-500">{badge.subtitle}</p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm font-medium text-gray-500">
                    Earned by
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {badge.earnedBy}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Welcome Treats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome Treats (Newbies)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4 md:grid-cols-2">
          {welcomeTreats.map((treat) => {
            const Icon = treat.icon;

            return (
              <div
                key={treat.title}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${treat.border}`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${treat.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 ${treat.iconText}`} />
                  </div>

                  <button
                    onClick={() => handleSendReward(treat.title)}
                    className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-green-100"
                  >
                    Send
                  </button>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {treat.title}
                </h3>
                <p className="text-sm text-gray-500">{treat.subtitle}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Recognition Activity */}
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="mb-8 text-2xl font-semibold text-gray-900">
          Recent Recognition Activity
        </h2>

        <div className="space-y-8">
          {recentRecognition.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={`${item.name}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-emerald-700">
                      {item.initials}
                    </div>

                    <div className="text-base text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {item.name}
                      </span>{" "}
                      {item.action}{" "}
                      <span className="font-semibold text-gray-900">
                        {item.badge}
                      </span>{" "}
                      badge
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon className={`h-4 w-4 ${item.iconText}`} />
                    <span>{item.time}</span>
                  </div>
                </div>

                {index !== recentRecognition.length - 1 && (
                  <div className="mt-6 border-t border-gray-100" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}