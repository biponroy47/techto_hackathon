interface Goal {
  label: string;
  current: number;
  target: number;
  color: string;
}

interface BudgetGoalsProps {
  goals: Goal[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function BudgetGoals({ goals }: BudgetGoalsProps) {
  return (
    <div className="dash-card dash-col-4">
      <p className="dash-label" style={{ marginBottom: 16 }}>
        Budget Remaining
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {goals.map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <div key={g.label}>
              <div className="dash-row" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#1c1a18" }}>
                  {g.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E9631A" }}>
                  {pct}%
                </span>
              </div>
              <div className="dash-progress-track">
                <div
                  className="dash-progress-fill"
                  style={{ width: `${pct}%`, background: g.color }}
                />
              </div>
              <div className="dash-row" style={{ marginTop: 2 }}>
                <span className="dash-sublabel">{fmt(g.current)}</span>
                <span className="dash-sublabel">{fmt(g.target)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
