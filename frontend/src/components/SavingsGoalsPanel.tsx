import { Pencil, Plus, Target } from "lucide-react";
import {
  estimateMonthlySavingsForGoals,
  parseSavingsGoals
} from "../lib/savingsGoals";

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

export default function SavingsGoalsPanel({
  raw,
  onAsk,
  onOpenAdd,
  onEdit,
  isLoading = false,
  className = ""
}: Props) {
  const items = parseSavingsGoals(raw);
  const monthlySavings = estimateMonthlySavingsForGoals(items);
  const panelClassName = ["goals-panel", "side-panel", className].filter(Boolean).join(" ");

  return (
    <aside className={panelClassName} aria-label="Savings goals">
      <div className="side-panel-header">
        <div className="side-panel-title">
          <Target aria-hidden="true" />
          <h2>Goals</h2>
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
          <p>No savings goals yet. Add an emergency fund, vacation, or other target here.</p>
          <button
            type="button"
            className="primary-button side-panel-add-button--empty"
            disabled={isLoading}
            onClick={onOpenAdd}
          >
            <Plus aria-hidden="true" />
            Add savings goal
          </button>
        </div>
      ) : (
        <>
          <ul className="side-panel-list">
            {items.map((item, index) => (
              <li key={`${index}-${item.label}`} className="side-panel-item">
                <div className="side-panel-item-main">
                  <span className="side-panel-item-label">{formatDisplayLabel(item)}</span>
                  {item.timelineLabel && (
                    <span className="goals-badge">{item.timelineLabel}</span>
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
                      onAsk(`Help me plan savings for this goal: ${item.label}`)
                    }
                  >
                    Plan for this
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {monthlySavings !== null && (
            <p className="side-panel-footnote">
              ≈ <strong>${monthlySavings.toLocaleString()}</strong>/mo to reach these targets
            </p>
          )}
        </>
      )}
    </aside>
  );
}
