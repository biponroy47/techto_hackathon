import { CalendarClock, Pencil, Plus } from "lucide-react";
import {
  estimateMonthlySetAside,
  parseUpcomingExpenses
} from "../lib/upcomingExpenses";

type Props = {
  raw: string;
  onAsk: (prompt: string) => void;
  onOpenAdd: () => void;
  onEdit: (line: string) => void;
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
  onOpenAdd,
  onEdit,
  isLoading = false,
  className = ""
}: Props) {
  const items = parseUpcomingExpenses(raw);
  const monthlySetAside = estimateMonthlySetAside(items);
  const panelClassName = ["upcoming-panel", "side-panel", className].filter(Boolean).join(" ");

  return (
    <aside className={panelClassName} aria-label="Upcoming expenses">
      <div className="side-panel-header">
        <div className="side-panel-title">
          <CalendarClock aria-hidden="true" />
          <h2>Upcoming</h2>
        </div>
        <button
          type="button"
          className="side-panel-add-button"
          disabled={isLoading}
          onClick={onOpenAdd}
        >
          <Plus aria-hidden="true" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="side-panel-empty">
          <p>No upcoming expenses yet. Add trips, tuition, or one-time costs here.</p>
          <button
            type="button"
            className="primary-button side-panel-add-button--empty"
            disabled={isLoading}
            onClick={onOpenAdd}
          >
            <Plus aria-hidden="true" />
            Add upcoming expense
          </button>
        </div>
      ) : (
        <>
          <ul className="side-panel-list">
            {items.map((item, index) => (
              <li key={`${index}-${item.label}`} className="side-panel-item">
                <div className="side-panel-item-main">
                  <span className="side-panel-item-label">{formatDisplayLabel(item)}</span>
                  {item.urgencyLabel && (
                    <span className="upcoming-badge">{item.urgencyLabel}</span>
                  )}
                </div>
                <div className="side-panel-item-actions">
                  <button
                    type="button"
                    className="side-panel-edit-button"
                    disabled={isLoading}
                    onClick={() => onEdit(item.label)}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="side-panel-plan-button"
                    disabled={isLoading}
                    onClick={() =>
                      onAsk(`Help me plan for this upcoming expense: ${item.label}`)
                    }
                  >
                    Plan for this
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {monthlySetAside !== null && (
            <p className="side-panel-footnote">
              ≈ <strong>${monthlySetAside.toLocaleString()}</strong>/mo to set aside
            </p>
          )}
        </>
      )}
    </aside>
  );
}
