import { FormEvent, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { parseLineToFormParts } from "../lib/profileLines";
import { formatSavingsGoalLine } from "../lib/savingsGoals";

type Props = {
  isOpen: boolean;
  isSaving?: boolean;
  editLine?: string | null;
  onClose: () => void;
  onSave: (line: string) => Promise<void>;
};

const emptyForm = {
  description: "",
  amount: "",
  timeline: ""
};

export default function AddSavingsGoalModal({
  isOpen,
  isSaving = false,
  editLine = null,
  onClose,
  onSave
}: Props) {
  const titleId = useId();
  const isEditing = Boolean(editLine);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editLine) {
      const parts = parseLineToFormParts(editLine);
      setForm({
        description: parts.description,
        amount: parts.amount,
        timeline: parts.timing
      });
    } else {
      setForm(emptyForm);
    }
    setFormError("");

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editLine, isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    const line = formatSavingsGoalLine(form);
    if (!line) {
      setFormError("Add a short description for this goal.");
      return;
    }

    try {
      await onSave(line);
      setForm(emptyForm);
    } catch {
      setFormError(
        isEditing ? "Could not update this goal. Try again." : "Could not save this goal. Try again."
      );
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={() => !isSaving && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{isEditing ? "Edit savings goal" : "Add savings goal"}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSaving}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>What is the goal?</span>
            <input
              value={form.description}
              placeholder="Emergency fund, vacation, new laptop..."
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              autoFocus
            />
          </label>

          <label className="field">
            <span>Target amount (optional)</span>
            <input
              inputMode="decimal"
              value={form.amount}
              placeholder="5000"
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Timeline (optional)</span>
            <input
              value={form.timeline}
              placeholder="in 12 months, by Dec 2026"
              onChange={(event) =>
                setForm((current) => ({ ...current, timeline: event.target.value }))
              }
            />
          </label>

          {formError && <p className="error-message">{formError}</p>}

          <div className="form-actions">
            <button type="button" className="secondary-button" disabled={isSaving} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Add to goals"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
