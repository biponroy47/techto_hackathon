import { TrendingUp, TrendingDown } from "lucide-react";

interface QuickStatsProps {
  saved: number;
  dailyAvg: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export function QuickStats({ saved, dailyAvg }: QuickStatsProps) {
  return (
    <>
      <div className="dash-card dash-col-2">
        <div
          className="dash-icon-circle"
          style={{ background: "#E9631A", marginBottom: 12 }}
        >
          <TrendingUp size={16} color="#fff" aria-hidden />
        </div>
        <div>
          <p className="dash-label">Saved</p>
          <p className="dash-stat-number">{fmt(saved)}</p>
          <p className="dash-sublabel" style={{ marginTop: 4 }}>
            this month
          </p>
        </div>
      </div>

      <div className="dash-card dash-col-2">
        <div
          className="dash-icon-circle"
          style={{ background: "#D9CEB8", marginBottom: 12 }}
        >
          <TrendingDown size={16} color="#1c1a18" aria-hidden />
        </div>
        <div>
          <p className="dash-label">Daily Avg</p>
          <p className="dash-stat-number">{fmt(dailyAvg)}</p>
          <p className="dash-sublabel" style={{ marginTop: 4 }}>
            per day spent
          </p>
        </div>
      </div>
    </>
  );
}
