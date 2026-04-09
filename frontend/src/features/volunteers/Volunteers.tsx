import { StatCard } from "../../components/shared/StatCard";
import { Users, Clock, CalendarDays, HeartHandshake, Trophy, Download, Star } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const attendanceData = [
  { month: "Jan", recurring: 100, newVolunteers: 120 },
  { month: "Feb", recurring: 112, newVolunteers: 135 },
  { month: "Mar", recurring: 132, newVolunteers: 160 },
  { month: "Apr", recurring: 125, newVolunteers: 148 },
  { month: "May", recurring: 148, newVolunteers: 182 },
  { month: "Jun", recurring: 162, newVolunteers: 210 },
  { month: "Jul", recurring: 178, newVolunteers: 232 },
  { month: "Aug", recurring: 178, newVolunteers: 220 },
  { month: "Sep", recurring: 190, newVolunteers: 242 },
  { month: "Oct", recurring: 210, newVolunteers: 262 },
  { month: "Nov", recurring: 228, newVolunteers: 284 },
  { month: "Dec", recurring: 248, newVolunteers: 322 },
];

const ageDistributionData = [
  { group: "18-24", volunteers: 42, color: "#059669" },
  { group: "25-34", volunteers: 120, color: "#34d399" },
  { group: "35-44", volunteers: 84, color: "#a7f3d0" },
  { group: "45-54", volunteers: 54, color: "#f2c84b" },
  { group: "55+", volunteers: 36, color: "#f59e0b" },
];

const genderData = [
  { name: "Female", value: 48, color: "#059669" },
  { name: "Male", value: 37, color: "#34d399" },
  { name: "Non-binary", value: 15, color: "#a7f3d0" },
];

const topThree = [
  {
    rank: 2,
    name: "Michael Chen",
    hours: 132,
    initials: "MC",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    ring: "border-slate-300",
    podiumBg: "bg-slate-100",
    podiumText: "text-slate-400",
    podiumHeight: "h-24",
    iconBg: "bg-slate-100",
    iconText: "text-slate-500",
  },
  {
    rank: 1,
    name: "Sarah Jenkins",
    hours: 145,
    initials: "SJ",
    badgeBg: "bg-yellow-100",
    badgeText: "text-amber-700",
    ring: "border-yellow-400",
    podiumBg: "bg-yellow-50",
    podiumText: "text-yellow-500",
    podiumHeight: "h-32",
    iconBg: "bg-yellow-100",
    iconText: "text-amber-500",
  },
  {
    rank: 3,
    name: "Elena Rodriguez",
    hours: 118,
    initials: "ER",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    ring: "border-orange-300",
    podiumBg: "bg-orange-50",
    podiumText: "text-orange-400",
    podiumHeight: "h-20",
    iconBg: "bg-orange-50",
    iconText: "text-orange-400",
  },
];

const honorableMentions = [
  { rank: 4, name: "David Kim", role: "Greeter", hours: 95, initials: "DK" },
  { rank: 5, name: "Jessica Taylor", role: "Kitchen Staff", hours: 88, initials: "JT" },
  { rank: 6, name: "Marcus Johnson", role: "Delivery Driver", hours: 82, initials: "MJ" },
];

export function Volunteers() {
  const handleExportClick = () => {
    console.log("Export data clicked");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Volunteers Directory & Trends</h1>
          <p className="text-sm text-gray-500">Analyze volunteer demographics, retention, and top contributors.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportClick}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f4f99] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#173d77]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Volunteers" value="342" change="+5.2% vs last month" changeType="positive" icon={Users} iconColor="bg-[#1f4f99]" />
        <StatCard title="Hours Logged" value="1,250" change="+8.2% vs last month" changeType="positive" icon={Clock} iconColor="bg-[#ff7a3d]" />
        <StatCard title="Active Events" value="12" change="-2.4% vs last month" changeType="negative" icon={CalendarDays} iconColor="bg-[#2fb36f]" />
        <StatCard
          title="Community Impact"
          value="3.2k"
          change="+12.3% people served"
          changeType="positive"
          icon={HeartHandshake}
          iconColor="bg-[#1f4f99]"
        />
      </div>

      {/* Attendance Breakdown - full width */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-xl font-semibold text-gray-900">Attendance Breakdown</h3>
        <p className="mb-4 text-sm text-gray-500">New vs recurrent volunteer attendance</p>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={attendanceData}>
            <defs>
              <linearGradient id="colorRecurringVolunteers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="colorNewVolunteersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="recurring"
              stroke="#059669"
              fill="url(#colorRecurringVolunteers)"
              strokeWidth={2}
              name="Recurrent Volunteers"
            />
            <Area
              type="monotone"
              dataKey="newVolunteers"
              stroke="#34d399"
              fill="url(#colorNewVolunteersFill)"
              strokeWidth={2}
              name="New Volunteers"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Age + Gender side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Age Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Age Distribution</h3>
          <p className="mb-4 text-sm text-gray-500">Active volunteers by age group</p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="group" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                }}
              />
              <Bar dataKey="volunteers" radius={[8, 8, 0, 0]}>
                {ageDistributionData.map((entry, index) => (
                  <Cell key={`age-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Gender Breakdown</h3>
          <p className="mb-4 text-sm text-gray-500">Self-reported gender identity</p>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={70} outerRadius={112} paddingAngle={4} dataKey="value">
                {genderData.map((entry, index) => (
                  <Cell key={`gender-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hall of Fame */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h3 className="text-2xl font-semibold text-gray-900">Volunteer Hall of Fame</h3>
          </div>
          <p className="text-sm text-gray-500">Top contributors this year</p>
        </div>

        {/* Top 3 podium */}
        <div className="mb-10 flex flex-col items-center">
          <div className="flex items-end justify-center gap-4 md:gap-8">
            {topThree.map((person) => (
              <div key={person.rank} className={`flex flex-col items-center text-center ${person.rank === 1 ? "md:-mt-6" : ""}`}>
                <div
                  className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 ${person.ring} ${person.badgeBg} text-4xl font-bold ${person.badgeText}`}
                >
                  {person.initials}
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${person.iconBg}`}>
                    <Trophy className={`h-5 w-5 ${person.iconText}`} />
                  </div>
                </div>

                <p className="text-xl font-semibold text-gray-900">{person.name}</p>
                <p className="mb-4 text-2xl font-semibold text-emerald-600">{person.hours} hrs</p>

                <div
                  className={`flex w-24 md:w-28 items-center justify-center rounded-t-xl border border-gray-200 ${person.podiumBg} ${person.podiumHeight}`}
                >
                  <span className={`text-4xl md:text-5xl font-bold ${person.podiumText}`}>{person.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 border-t border-gray-200" />

        {/* Honorable mentions */}
        <div>
          <h4 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Honorable Mentions</h4>

          <div className="space-y-5">
            {honorableMentions.map((person) => (
              <div key={person.rank} className="flex items-center justify-between rounded-xl px-2 py-2">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-2xl font-medium text-gray-400">{person.rank}</div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-base font-semibold text-green-700">
                    {person.initials}
                  </div>

                  <div>
                    <p className="text-xl font-medium text-gray-900">{person.name}</p>
                    <p className="text-sm text-gray-500">{person.role}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-xl font-semibold text-emerald-600">
                  <Star className="h-5 w-5 fill-current" />
                  {person.hours} hrs
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
