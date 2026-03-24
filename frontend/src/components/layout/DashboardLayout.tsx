// import { Outlet, Link, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   Presentation,
//   DollarSign,
//   TrendingUp,
//   Menu,
//   Bell,
//   LogOut,
// } from "lucide-react";
// import { useState } from "react";

// export function DashboardLayout() {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const navigation = [
//     { name: "Overview", href: "/", icon: LayoutDashboard },
//     { name: "Volunteers", href: "/volunteers", icon: Users },
//     { name: "Exhibitions", href: "/exhibitions", icon: Presentation },
//     { name: "Revenue", href: "/revenue", icon: DollarSign },
//   ];

//   const handleLogout = () => {
//     console.log("Logout clicked");
//   };

//   return (
//     <div className="flex h-screen bg-background">
//       {/* Sidebar */}
//       <aside
//         className={`bg-sidebar text-sidebar-foreground transition-all duration-300 ${
//           sidebarOpen ? "w-64" : "w-0 overflow-hidden"
//         }`}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="p-6 border-b border-sidebar-border">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
//                 <TrendingUp className="w-6 h-6 text-secondary-foreground" />
//               </div>
//               <div>
//                 <h1 className="text-lg text-sidebar-foreground">
//                   Science Museum
//                 </h1>
//                 <p className="text-xs text-sidebar-foreground/70">
//                   of Oklahoma
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 p-4 space-y-2">
//             {navigation.map((item) => {
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//                     isActive
//                       ? "bg-sidebar-primary text-sidebar-primary-foreground"
//                       : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
//                   }`}
//                 >
//                   <item.icon className="w-5 h-5" />
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </nav>

//           {/* Footer */}
//           <div className="p-4 border-t border-sidebar-border space-y-3">
//             <div className="text-xs text-sidebar-foreground/60">
//               Last updated: March 8, 2026
//             </div>

//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
//             >
//               <LogOut className="w-5 h-5" />
//               <span>Log out</span>
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top Bar */}
//         <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 hover:bg-muted rounded-lg transition-colors"
//           >
//             <Menu className="w-5 h-5" />
//           </button>

//           <div className="flex items-center gap-4">
//             <div className="text-sm text-muted-foreground hidden sm:block">
//               Dashboard Analytics
//             </div>

//             <button
//               className="relative p-2 hover:bg-muted rounded-full transition-colors"
//               aria-label="Notifications"
//             >
//               <Bell className="w-5 h-5 text-muted-foreground" />
//               <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
//             </button>

//             <button
//               className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90 transition"
//               aria-label="Profile"
//             >
//               NT
//             </button>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }


// import { Outlet, Link, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   Presentation,
//   DollarSign,
//   Menu,
// } from "lucide-react";
// import { useState } from "react";

// export function DashboardLayout() {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const navigation = [
//     { name: "Overview", href: "/", icon: LayoutDashboard },
//     { name: "Volunteers", href: "/volunteers", icon: Users },
//     { name: "Exhibitions", href: "/exhibitions", icon: Presentation },
//     { name: "Revenue", href: "/revenue", icon: DollarSign },
//   ];

//   return (
//     <div className="flex h-screen bg-background">
//       <aside
//         className={`border-r bg-white transition-all duration-300 ${
//           sidebarOpen ? "w-64" : "w-0 overflow-hidden"
//         }`}
//       >
//         <div className="flex flex-col h-full">
//           <div className="p-6 border-b">
//             <h1 className="text-lg font-semibold">Science Museum</h1>
//             <p className="text-sm text-gray-500">of Oklahoma</p>
//           </div>

//           <nav className="flex-1 p-4 space-y-2">
//             {navigation.map((item) => {
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
//                     isActive
//                       ? "bg-blue-100 text-blue-700"
//                       : "text-gray-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   <item.icon className="w-5 h-5" />
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <header className="border-b px-6 py-4 flex items-center justify-between bg-white">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 hover:bg-gray-100 rounded-lg"
//           >
//             <Menu className="w-5 h-5" />
//           </button>

//           <div className="text-sm text-gray-500">Dashboard Analytics</div>
//         </header>

//         <main className="flex-1 overflow-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }


// import { Outlet, Link, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   Presentation,
//   DollarSign,
//   Menu,
// } from "lucide-react";
// import { useState } from "react";

// export function DashboardLayout() {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const navigation = [
//     { name: "Overview", href: "/", icon: LayoutDashboard },
//     { name: "Volunteers", href: "/volunteers", icon: Users },
//     { name: "Exhibitions", href: "/exhibitions", icon: Presentation },
//     { name: "Revenue", href: "/revenue", icon: DollarSign },
//   ];

//   return (
//     <div className="flex h-screen bg-background">
//       <aside
//         className={`border-r bg-white transition-all duration-300 ${
//           sidebarOpen ? "w-64" : "w-0 overflow-hidden"
//         }`}
//       >
//         <div className="flex flex-col h-full">
//           <div className="p-6 border-b">
//             <h1 className="text-lg font-semibold">Science Museum</h1>
//             <p className="text-sm text-gray-500">of Oklahoma</p>
//           </div>

//           <nav className="flex-1 p-4 space-y-2">
//             {navigation.map((item) => {
//               const isActive = location.pathname === item.href;
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
//                     isActive
//                       ? "bg-blue-100 text-blue-700"
//                       : "text-gray-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   <item.icon className="w-5 h-5" />
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <header className="border-b px-6 py-4 flex items-center justify-between bg-white">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 hover:bg-gray-100 rounded-lg"
//           >
//             <Menu className="w-5 h-5" />
//           </button>

//           <div className="text-sm text-gray-500">Dashboard Analytics</div>
//         </header>

//         <main className="flex-1 overflow-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }



import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Award,
  Presentation,
  DollarSign,
  TrendingUp,
  Menu,
  Bell,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard, disabled: false },
    { name: "Volunteers", href: "/volunteers", icon: Users, disabled: false },
    { name: "Recognition", href: "/recognition", icon: Award, disabled: false },
    { name: "Exhibitions", href: "/exhibitions", icon: Presentation, disabled: true },
    { name: "Revenue", href: "/revenue", icon: DollarSign, disabled: true },
  ];

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <div className="flex h-screen bg-slate-50">
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
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-white/40"
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
    </div>
  );
}