import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  estimateMonthlySetAside,
  parseUpcomingExpenses
} from "../lib/upcomingExpenses";

type Props = {
  raw: string;
  onAsk: (prompt: string) => void;
  isLoading?: boolean;
  className?: string;
};

function formatDisplayLabel(item: { label: string; amount?: number }): string {
  if (item.amount === undefined) {
    return item.label;
  }

  const withoutAmount = item.label
    .replace(/\$?\s*[\d,]+(?:\.\d{2})?/g, "")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = withoutAmount || item.label;
  return `${title} — $${item.amount.toLocaleString()}`;
}

export default function UpcomingExpensesPanel({
  raw,
  onAsk,
  isLoading = false,
  className = ""
}: Props) {
  const items = parseUpcomingExpenses(raw);
  const monthlySetAside = estimateMonthlySetAside(items);
  const panelClassName = ["upcoming-panel", className].filter(Boolean).join(" ");

  return (
    <aside className={panelClassName} aria-label="Upcoming expenses">
      <div className="upcoming-panel-header">
        <CalendarClock aria-hidden="true" />
        <h2>Upcoming</h2>
      </div>

      {items.length === 0 ? (
        <div className="upcoming-panel-empty">
          <p>No upcoming expenses yet. Add trips, tuition, or one-time costs in onboarding.</p>
          <Link to="/onboarding" className="text-link">
            Add upcoming expenses
          </Link>
        </div>
      ) : (
        <>
          <ul className="upcoming-list">
            {items.map((item) => (
              <li key={item.label} className="upcoming-item">
                <div className="upcoming-item-main">
                  <span className="upcoming-item-label">{formatDisplayLabel(item)}</span>
                  {item.urgencyLabel && (
                    <span className="upcoming-badge">{item.urgencyLabel}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="upcoming-plan-button"
                  disabled={isLoading}
                  onClick={() =>
                    onAsk(`Help me plan for this upcoming expense: ${item.label}`)
                  }
                >
                  Plan for this
                </button>
              </li>
            ))}
          </ul>

          {monthlySetAside !== null && (
            <p className="upcoming-set-aside">
              ≈ <strong>${monthlySetAside.toLocaleString()}</strong>/mo to set aside
            </p>
          )}

          <Link to="/onboarding" className="text-link upcoming-edit-link">
            Add or edit
          </Link>
        </>
      )}
    </aside>
  );
}
