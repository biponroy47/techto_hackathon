import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UpcomingExpenseItem } from "../../lib/upcomingExpenses";

type SpendLevel = "low" | "mid" | "high";

interface SpendingCalendarProps {
  month: string;
  year: number;
  startWeekday: number;
  totalDays: number;
  today: number;
  spendingDays: Record<number, SpendLevel>;
  upcomingExpenseDays?: Record<number, UpcomingExpenseItem[]>;
  upcomingExpenses?: UpcomingExpenseItem[];
  className?: string;
}

const DOT_COLOR: Record<SpendLevel, string> = {
  low: "#a89880",
  mid: "#E9631A",
  high: "#c94f14",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthNameToIndex(month: string): number {
  const lower = month.trim().toLowerCase();
  const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === lower);
  if (idx >= 0) {
    return idx;
  }

  const shortIdx = MONTH_NAMES.findIndex((m) =>
    m.toLowerCase().startsWith(lower.slice(0, 3)),
  );
  return shortIdx >= 0 ? shortIdx : new Date().getMonth();
}

function parseDueDateLabel(raw: string | undefined): Date | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(
    /(?:^|\s)([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(\d{4}))?/,
  );
  if (!match) {
    return null;
  }

  const monthIdx = monthNameToIndex(match[1]);
  const day = Number.parseInt(match[2], 10);
  const year = match[3]
    ? Number.parseInt(match[3], 10)
    : new Date().getFullYear();

  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return null;
  }

  const candidate = new Date(year, monthIdx, day);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
}

function resolveExpenseDate(item: UpcomingExpenseItem): Date | null {
  if (item.dateISO) {
    const d = new Date(`${item.dateISO}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d;
    }
  }

  return parseDueDateLabel(item.urgencyLabel) ?? parseDueDateLabel(item.label);
}

export function SpendingCalendar({
  month,
  year,
  startWeekday,
  totalDays,
  today,
  spendingDays,
  upcomingExpenseDays = {},
  upcomingExpenses = [],
  className,
}: SpendingCalendarProps) {
  const baseMonth = monthNameToIndex(month);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(baseMonth);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [viewYear, viewMonth]);

  const calendarMeta = useMemo(() => {
    if (viewYear === year && viewMonth === baseMonth) {
      return {
        startWeekday,
        totalDays,
      };
    }

    return {
      startWeekday: new Date(viewYear, viewMonth, 1).getDay(),
      totalDays: new Date(viewYear, viewMonth + 1, 0).getDate(),
    };
  }, [baseMonth, startWeekday, totalDays, viewMonth, viewYear, year]);

  const displayMonthName = MONTH_NAMES[viewMonth];
  const currentDate = new Date();

  const mappedUpcomingDays = useMemo(() => {
    const grouped: Record<number, UpcomingExpenseItem[]> = {};
    for (const item of upcomingExpenses) {
      const d = resolveExpenseDate(item);
      if (!d) {
        continue;
      }
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) {
        continue;
      }

      const day = d.getDate();
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(item);
    }

    return grouped;
  }, [upcomingExpenses, viewMonth, viewYear]);

  const effectiveUpcomingDays =
    upcomingExpenses.length > 0 ? mappedUpcomingDays : upcomingExpenseDays;

  const cells: (number | null)[] = Array(calendarMeta.startWeekday).fill(null);
  for (let d = 1; d <= calendarMeta.totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={className ?? "dash-card dash-col-5"}>
      <div className="dash-row" style={{ marginBottom: 12 }}>
        <h2 className="dash-section-title">Spending Calendar</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="dash-cal-nav"
            aria-label="Previous month"
            onClick={() => {
              if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear((prev) => prev - 1);
                return;
              }
              setViewMonth((prev) => prev - 1);
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="dash-pill">
            {displayMonthName} {viewYear}
          </span>
          <button
            type="button"
            className="dash-cal-nav"
            aria-label="Next month"
            onClick={() => {
              if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear((prev) => prev + 1);
                return;
              }
              setViewMonth((prev) => prev + 1);
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
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
          const level =
            viewYear === year && viewMonth === baseMonth
              ? spendingDays[day]
              : undefined;
          const upcoming = effectiveUpcomingDays[day] ?? [];
          const hasUpcoming = upcoming.length > 0;
          const isToday =
            (viewYear === year && viewMonth === baseMonth && day === today) ||
            (viewYear === currentDate.getFullYear() &&
              viewMonth === currentDate.getMonth() &&
              day === currentDate.getDate());
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
                border:
                  isToday && !isSel
                    ? "1.5px solid #E9631A"
                    : "1.5px solid transparent",
              }}
              aria-label={`${day}${level ? `, ${level} spending` : ""}${hasUpcoming ? `, ${upcoming.length} upcoming expense${upcoming.length > 1 ? "s" : ""}` : ""}`}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  marginTop: 1,
                  minHeight: 6,
                }}
              >
                {level && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isSel
                        ? "rgba(255,255,255,0.8)"
                        : DOT_COLOR[level],
                      display: "block",
                    }}
                  />
                )}
                {hasUpcoming && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 1,
                      background: isSel ? "rgba(255,255,255,0.9)" : "#4a90e2",
                      display: "block",
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}
      >
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
            <span
              style={{
                fontSize: 10,
                color: "#6b6358",
                textTransform: "capitalize",
              }}
            >
              {k === "mid" ? "Normal" : k === "high" ? "High" : "Low"}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#4a90e2",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 10, color: "#6b6358" }}>Upcoming</span>
        </div>
      </div>

      {/* Upcoming expenses for selected day */}
      {selected !== null &&
        (effectiveUpcomingDays[selected] ?? []).length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "#f5f0e8",
              borderRadius: 8,
              borderLeft: "3px solid #4a90e2",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4a90e2",
                marginBottom: 6,
              }}
            >
              Upcoming on {displayMonthName} {selected}
            </p>
            {(effectiveUpcomingDays[selected] ?? []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 12, color: "#1c1a18" }}>
                  {item.label
                    .replace(/\s*\$?\s*[\d,]+(?:\.\d{2})?/g, "")
                    .trim() || item.label}
                </span>
                {item.amount !== undefined && (
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#E9631A" }}
                  >
                    ${item.amount.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
