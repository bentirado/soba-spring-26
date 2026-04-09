// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import { Overview } from "@/features/overview/Overview";
// import { Volunteers } from "@/features/volunteers/Volunteers";
// import { Exhibitions } from "@/features/exhibitions/Exhibitions";
// import { Revenue } from "@/features/revenue/Revenue";

// const router = createBrowserRouter([
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

// export default function App() {
//   return <RouterProvider router={router} />;
// }

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { DashboardLayout } from "../components/layout/DashboardLayout";

// function OverviewPage() {
//   return <div>Overview page is loading</div>;
// }

// function VolunteersPage() {
//   return <div>Volunteers page is loading</div>;
// }

// function ExhibitionsPage() {
//   return <div>Exhibitions page is loading</div>;
// }

// function RevenuePage() {
//   return <div>Revenue page is loading</div>;
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<DashboardLayout />}>
//           <Route index element={<OverviewPage />} />
//           <Route path="volunteers" element={<VolunteersPage />} />
//           <Route path="exhibitions" element={<ExhibitionsPage />} />
//           <Route path="revenue" element={<RevenuePage />} />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Overview } from "../features/overview/Overview";
import { Volunteers } from "../features/volunteers/Volunteers";
import { Recognition } from "../features/recognition/Recognition";
import { Exhibitions } from "../features/exhibitions/Exhibitions";
import { Revenue } from "../features/revenue/Revenue";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="recognition" element={<Recognition />} />
          <Route path="exhibitions" element={<Exhibitions />} />
          <Route path="revenue" element={<Revenue />} />
        </Route>
      </Routes>
      
    </BrowserRouter>
  );
}
