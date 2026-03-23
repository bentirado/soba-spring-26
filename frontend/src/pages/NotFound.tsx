import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card">
      <h2 className="h1">Page not found</h2>
      <p className="meta">The route you requested does not exist.</p>
      <div style={{ marginTop: 12 }}>
        <Link to="/">Return to Dashboard</Link>
      </div>
    </div>
  );
}
