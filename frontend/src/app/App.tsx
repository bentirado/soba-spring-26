import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Overview } from "../features/overview/Overview";
import { Volunteers } from "../features/volunteers/Volunteers";
import { Recognition } from "../features/recognition/Recognition";
import { SignIn } from "../features/auth/SignIn";
import { SignUp } from "../features/auth/SignUp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path shows sign in */}
        <Route path="/" element={<SignIn />} />

        {/* Auth routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Dashboard routes - keep at root but make them work */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="recognition" element={<Recognition />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}