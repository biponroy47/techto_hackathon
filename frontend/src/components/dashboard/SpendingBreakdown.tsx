interface BreakdownItem {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface SpendingBreakdownProps {
  breakdown: BreakdownItem[];
}

function DonutChart({ breakdown }: { breakdown: BreakdownItem[] }) {
  const total = breakdown.reduce((s, d) => s + d.value, 0);
  const r = 52;
  const cx = 70;
  const cy = 70;
  let cumulative = 0;

  const slices = breakdown.map((d) => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, path };
  });

  return (
    <svg
      viewBox="0 0 140 140"
      style={{ width: "100%", maxWidth: 140, flexShrink: 0 }}
      role="img"
      aria-label="Spending breakdown donut chart"
    >
      {slices.map((s) => (
        <path key={s.label} d={s.path} fill={s.color} />
      ))}
      <circle cx={cx} cy={cy} r={34} fill="#EBEBDF" />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="10"
        fill="#1c1a18"
        fontWeight="600"
      >
        Total
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="#6b6358">
        ${(total / 1000).toFixed(1)}k
      </text>
    </svg>
  );
}

export function SpendingBreakdown({ breakdown }: SpendingBreakdownProps) {
  return (
    <div className="dash-card dash-col-3">
      <h2 className="dash-section-title" style={{ marginBottom: 16 }}>
        Where it goes
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <DonutChart breakdown={breakdown} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          {breakdown.map((b) => (
            <div
              key={b.label}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: b.color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#1c1a18",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.label}
                </span>
              </div>
              <span
                style={{ fontSize: 11, fontWeight: 700, color: "#6b6358", flexShrink: 0 }}
              >
                {b.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
