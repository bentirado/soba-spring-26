import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Overview } from "../features/overview/Overview";
import { Volunteers } from "../features/volunteers/Volunteers";
import { Recognition } from "../features/recognition/Recognition";
import { Events } from "../features/events/Events";
import { Apply } from "../features/apply/Apply";
import { SignIn } from "../features/auth/SignIn";
import { SignUp } from "../features/auth/SignUp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/apply" element={<Apply />} />

        {/* Dashboard routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="events" element={<Events />} />
          <Route path="recognition" element={<Recognition />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}