export default function Analytics() {
  return (
    <div className="card">
      <h2 className="h1">Analytics</h2>
      <p className="meta">Charts and insights (placeholders for line, bar, and pie charts)</p>

      <div style={{ marginTop: 16 }}>
        <div className="grid chart-grid">
          <div className="card chart">
            <div className="chart-title">Overview (Line)</div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 300 120" preserveAspectRatio="none" width="100%" height="100%">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d="M0 80 C60 40 120 20 180 40 C240 60 300 30 300 30" fill="url(#g1)" stroke="var(--primary)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="card chart">
            <div className="chart-title">Programs (Bar)</div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 300 120" preserveAspectRatio="none" width="100%" height="100%">
                <rect x="20" y="40" width="30" height="60" rx="4" fill="var(--chart-1)" />
                <rect x="70" y="20" width="30" height="80" rx="4" fill="var(--chart-2)" />
                <rect x="120" y="55" width="30" height="45" rx="4" fill="var(--chart-3)" />
                <rect x="170" y="10" width="30" height="90" rx="4" fill="var(--chart-4)" />
                <rect x="220" y="35" width="30" height="65" rx="4" fill="var(--chart-5)" />
              </svg>
            </div>
          </div>

          <div className="card chart">
            <div className="chart-title">Volunteer Distribution (Pie)</div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 120 120" width="100%" height="100%">
                <circle cx="60" cy="60" r="40" fill="var(--chart-1)" stroke="var(--card-bg)" strokeWidth="6" strokeDasharray="100 50" transform="rotate(-30 60 60)" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="var(--chart-2)" strokeWidth="6" strokeDasharray="60 140" transform="rotate(50 60 60)" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="var(--chart-3)" strokeWidth="6" strokeDasharray="40 160" transform="rotate(140 60 60)" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="grid">
          <div className="card">KPIs / small stat 1</div>
          <div className="card">KPIs / small stat 2</div>
          <div className="card">KPIs / small stat 3</div>
        </div>
      </div>
    </div>
  );
}
