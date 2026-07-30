import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Award,
  TrendingUp,
  Menu,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { dashboardRangeOptions, useDashboardRange, type DashboardRangeLabel } from "@/features/dashboard/DashboardRangeProvider";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut, user } = useAuth();
  const { selectedRange, setSelectedRange } = useDashboardRange();
  const rangeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rangeOpen, setRangeOpen] = useState(false);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, disabled: false },
    { name: "Volunteers", href: "/dashboard/volunteers", icon: Users, disabled: false },
    { name: "Recognition", href: "/dashboard/recognition", icon: Award, disabled: false },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/signin", { replace: true });
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

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const emailName = user?.email?.split("@")[0] ?? "";
  const emailNameParts = emailName.split(/[._\-\s]+/).filter(Boolean);
  const profileInitials = (
    emailNameParts.length > 1
      ? emailNameParts.map((part) => part[0]).join("")
      : emailName.slice(0, 2)
  )
    .slice(0, 2)
    .toUpperCase() || "SM";

  return (
  <div className="flex h-screen bg-background">
      <aside
        className={`bg-[#1f4f99] text-white transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/15 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff7a3d]">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Science Museum
                </h1>
                <p className="text-xs text-white/75">of Oklahoma</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/40 select-none opacity-50 relative cursor-not-allowed"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-[#ff7a3d] text-white"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-white/15 p-4">


            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative" ref={rangeDropdownRef}>
              <button
                onClick={() => setRangeOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:px-4"
              >
                <span>{selectedRange}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
              </button>

              {rangeOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {dashboardRangeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRange(option as DashboardRangeLabel);
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

            <div className="hidden text-right sm:block">
              <div className="text-sm text-slate-600">
                {displayName || user?.email || "Dashboard Analytics"}
              </div>
              {role && (
                <div className="text-xs capitalize text-slate-400">
                  {role}
                </div>
              )}
            </div>

            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-sm font-medium text-white transition hover:bg-blue-700"
              aria-label="Profile"
            >
              {profileInitials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
