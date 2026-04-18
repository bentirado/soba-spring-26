import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Award,
  TrendingUp,
  Menu,
  Bell,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { Chatbot } from "@/components/Chatbot";

export function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, disabled: false },
    { name: "Volunteers", href: "/dashboard/volunteers", icon: Users, disabled: false },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays, disabled: false },
    { name: "Recognition", href: "/dashboard/recognition", icon: Award, disabled: false },
  ];

  const handleLogout = () => {
    console.log("Logout clicked");
    // Optional: Add logout logic here later
    // navigate("/signin");
  };

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
            <div className="text-xs text-white/70">
              Last updated: March 8, 2026
            </div>

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

          <div className="flex items-center gap-4">
            <div className="hidden text-sm text-slate-500 sm:block">
              Dashboard Analytics
            </div>

            <button
              className="relative rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-sm font-medium text-white transition hover:bg-blue-700"
              aria-label="Profile"
            >
              NT
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <Chatbot />
    </div>
  );
}
