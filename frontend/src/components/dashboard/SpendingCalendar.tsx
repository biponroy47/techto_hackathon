import { useState } from "react";

type SpendLevel = "low" | "mid" | "high";

interface SpendingCalendarProps {
  month: string;
  year: number;
  startWeekday: number;
  totalDays: number;
  today: number;
  spendingDays: Record<number, SpendLevel>;
}

const DOT_COLOR: Record<SpendLevel, string> = {
  low: "#a89880",
  mid: "#E9631A",
  high: "#c94f14",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function SpendingCalendar({
  month,
  year,
  startWeekday,
  totalDays,
  today,
  spendingDays,
}: SpendingCalendarProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="dash-card dash-col-5">
      <div className="dash-row" style={{ marginBottom: 16 }}>
        <h2 className="dash-section-title">Spending Calendar</h2>
        <span className="dash-pill">
          {month} {year}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b6358",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 3,
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const level = spendingDays[day];
          const isToday = day === today;
          const isSel = day === selected;

          return (
            <button
              key={i}
              onClick={() => setSelected(day === selected ? null : day)}
              className="dash-cal-day"
              style={{
                background: isSel
                  ? "#E9631A"
                  : isToday
                  ? "#D9CEB8"
                  : "transparent",
                border: isToday && !isSel
                  ? "1.5px solid #E9631A"
                  : "1.5px solid transparent",
              }}
              aria-label={`${day}${level ? `, ${level} spending` : ""}`}
              aria-pressed={isSel}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: isSel ? "#fff" : "#1c1a18",
                }}
              >
                {day}
              </span>
              {level && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    marginTop: 1,
                    background: isSel
                      ? "rgba(255,255,255,0.8)"
                      : DOT_COLOR[level],
                    display: "block",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {(["low", "mid", "high"] as SpendLevel[]).map((k) => (
          <div
            key={k}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: DOT_COLOR[k],
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: "#6b6358", textTransform: "capitalize" }}>
              {k === "mid" ? "Normal" : k === "high" ? "High" : "Low"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
