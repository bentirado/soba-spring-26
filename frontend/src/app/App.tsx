import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Overview } from "../features/overview/Overview";
import { Volunteers } from "../features/volunteers/Volunteers";
import { Recognition } from "../features/recognition/Recognition";
import { Events } from "../features/events/Events";
import { Apply } from "../features/apply/Apply";
import { SignIn } from "../features/auth/SignIn";
import { SignUp } from "../features/auth/SignUp";
import { AuthProvider } from "../features/auth/AuthProvider";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
// import { Exhibitions } from "../features/exhibitions/Exhibitions";
// import { Revenue } from "../features/revenue/Revenue";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root path shows sign in */}
          <Route path="/" element={<SignIn />} />

          {/* Auth routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/apply" element={<Apply />} />

          {/* Dashboard routes - keep at root but make them work */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="events" element={<Events />} />
            <Route path="recognition" element={<Recognition />} />
            {/* <Route path="exhibitions" element={<Exhibitions />} /> */}
            {/* <Route path="revenue" element={<Revenue />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
