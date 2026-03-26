// import { createBrowserRouter } from "react-router-dom";
// import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import { Overview } from "@/features/overview/Overview";
// import { Volunteers } from "@/features/volunteers/Volunteers";
// import { Exhibitions } from "@/features/exhibitions/Exhibitions";
// import { Revenue } from "@/features/revenue/Revenue";

// export const router = createBrowserRouter([
//   {
//     path: "/",
//     Component: DashboardLayout,
//     children: [
//       { index: true, Component: Overview },
//       { path: "volunteers", Component: Volunteers },
//       { path: "exhibitions", Component: Exhibitions },
//       { path: "revenue", Component: Revenue },
//     ],
//   },
// ]);

import { createBrowserRouter } from "react-router-dom";

function TestPage() {
  return <div style={{ padding: 24 }}>Router is working</div>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TestPage />,
  },
]);