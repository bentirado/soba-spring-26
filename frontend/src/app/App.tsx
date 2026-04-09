import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Overview } from "../features/overview/Overview";
import { Volunteers } from "../features/volunteers/Volunteers";
import { Recognition } from "../features/recognition/Recognition";
// import { Exhibitions } from "../features/exhibitions/Exhibitions";
// import { Revenue } from "../features/revenue/Revenue";
import { SignIn } from "../features/auth/SignIn";
import { SignUp } from "../features/auth/SignUp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Dashboard routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="recognition" element={<Recognition />} />
          {/* <Route path="exhibitions" element={<Exhibitions />} /> */}
          {/* <Route path="revenue" element={<Revenue />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}