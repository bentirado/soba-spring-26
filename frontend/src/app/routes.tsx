import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Overview } from "@/features/overview/Overview";
import { Volunteers } from "@/features/volunteers/Volunteers";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Overview },
      { path: "volunteers", Component: Volunteers },
    ],
  },
]);