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