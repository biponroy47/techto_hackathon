import { FormEvent, useEffect, useId, useState } from "react";
import { X } from "lucide-react";

export type NetWorthItem = {
  id: string;
  name: string;
  amount: string;
  type: string;
};

type Props = {
  isOpen: boolean;
  isSaving?: boolean;
  editItem?: NetWorthItem | null;
  onClose: () => void;
  onSave: (item: Omit<NetWorthItem, "id">) => Promise<void>;
};

const emptyForm = { name: "", amount: "", type: "Cash / Chequing" };

export const netWorthItemTypes = [
  "Cash / Chequing",
  "Savings",
  "TFSA",
  "RRSP / 401(k)",
  "Stocks / ETF",
  "Real Estate",
  "GIC / Bonds",
  "Crypto",
  "Other",
];

export default function AddNetWorthItemModal({
  isOpen,
  isSaving = false,
  editItem = null,
  onClose,
  onSave,
}: Props) {
  const titleId = useId();
  const isEditing = Boolean(editItem);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setForm(
      editItem
        ? { name: editItem.name, amount: editItem.amount, type: editItem.type }
        : emptyForm,
    );
    setFormError("");

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editItem, isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Add a name for this asset.");
      return;
    }

    const parsed = parseFloat(form.amount);
    if (!form.amount.trim() || isNaN(parsed) || parsed < 0) {
      setFormError("Enter a valid dollar amount.");
      return;
    }

    try {
      await onSave({
        name: form.name.trim(),
        amount: form.amount.trim(),
        type: form.type,
      });
      setForm(emptyForm);
    } catch {
      setFormError(
        isEditing
          ? "Could not update this item. Try again."
          : "Could not save this item. Try again.",
      );
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{isEditing ? "Edit asset" : "Add asset"}</h2>
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

        <form className="modal-form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              placeholder="TD Savings, Condo, VGRO ETF..."
              autoFocus
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            />
          </label>

          <label className="field">
            <span>Current value ($)</span>
            <input
              inputMode="decimal"
              value={form.amount}
              placeholder="25000"
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  amount: e.target.value.replace(/[^\d.]/g, ""),
                }))
              }
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
            >
              {netWorthItemTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {formError && <p className="error-message">{formError}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
