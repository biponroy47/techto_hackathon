// onboarding-form.jsx — single-page ~30s form with 3 blocks.
// Block 1: name + age + living
// Block 2: take-home + frequency
// Block 3: recurring monthly expenses (chip picker + inline amount)

// ── Section block heading ────────────────────────────────────────────────────
function BlockHeader({ index, title, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12,
        fontFamily: "var(--font-display)",
        marginBottom: 6,
      }}>
        <span style={{
          fontWeight: 900, fontSize: 18,
          color: "var(--primary)",
          letterSpacing: "0.06em",
          fontFeatureSettings: "'tnum'",
        }}>
          0{index}
        </span>
        <span style={{
          fontWeight: 700, fontSize: 22,
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}>
          {title}
        </span>
      </div>
      {hint && (
        <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ── Block 1: You ─────────────────────────────────────────────────────────────
function BlockYou({ data, set, errors }) {
  return (
    <section>
      <BlockHeader index={1} title="You" hint="Just the basics — keeps the rest of this fast." />
      <div className="neg-fluid-2" style={{ marginBottom: 14 }}>
        <Field
          label="First name"
          required
          placeholder="e.g. Alex"
          autoComplete="given-name"
          value={data.name}
          onChange={(v) => set({ name: v })}
          error={errors.name}
        />
        <Field
          label="Age"
          required
          placeholder="e.g. 22"
          type="number"
          inputMode="numeric"
          min="13" max="120"
          numeric
          value={data.age}
          onChange={(v) => set({ age: v })}
          error={errors.age}
        />
      </div>
      <div>
        <span className="neg-label">
          <span>Living situation</span>
          <span className="neg-label-aux">Pick the closest</span>
        </span>
        <ChipGroup
          options={["With parents", "With roommates", "Living alone", "With partner", "On-campus"]}
          value={data.living}
          onChange={(v) => set({ living: v })}
        />
        {errors.living && <div className="neg-error">{errors.living}</div>}
      </div>
    </section>
  );
}

// ── Block 2: Money in ────────────────────────────────────────────────────────
function BlockMoneyIn({ data, set, errors }) {
  return (
    <section>
      <BlockHeader
        index={2}
        title="Money in"
        hint="Approximate is fine — you can fine-tune later from settings."
      />
      <div className="neg-fluid-2">
        <Field
          label="Take-home pay"
          required
          aux="After taxes"
          prefix="$"
          placeholder="e.g. 2,800"
          inputMode="decimal"
          numeric
          value={data.income}
          onChange={(v) => set({ income: v.replace(/[^\d.]/g, "") })}
          error={errors.income}
        />
        <Select
          label="How often?"
          value={data.frequency}
          onChange={(v) => set({ frequency: v })}
          options={[
            { value: "monthly",  label: "Monthly" },
            { value: "biweekly", label: "Every 2 weeks" },
            { value: "weekly",   label: "Weekly" },
            { value: "annual",   label: "Annual salary" },
            { value: "variable", label: "It varies" },
          ]}
        />
      </div>
    </section>
  );
}

// ── Block 3: Recurring expenses ──────────────────────────────────────────────
const COMMON_EXPENSES = [
  "Rent / mortgage",
  "Groceries",
  "Transit",
  "Phone",
  "Internet",
  "Utilities",
  "Subscriptions",
  "Gym / fitness",
  "Eating out",
  "Coffee",
  "Insurance",
  "Pets",
];

function BlockExpenses({ data, set, errors }) {
  const [customDraft, setCustomDraft] = React.useState("");
  const active = data.expenses;
  const activeNames = new Set(active.map((e) => e.label.toLowerCase()));
  const inactive = COMMON_EXPENSES.filter((c) => !activeNames.has(c.toLowerCase()));

  const addCategory = (label, amount = "") => {
    const t = label.trim();
    if (!t || activeNames.has(t.toLowerCase())) return;
    set({
      expenses: [...active, { id: Date.now() + Math.random(), label: t, amount }],
    });
  };
  const updateAmount = (id, v) => {
    set({ expenses: active.map((e) => e.id === id ? { ...e, amount: v.replace(/[^\d.]/g, "") } : e) });
  };
  const remove = (id) => set({ expenses: active.filter((e) => e.id !== id) });

  const total = active.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <section>
      <BlockHeader
        index={3}
        title="What you spend on, monthly"
        hint="Tap the ones that apply, then drop in a rough number. Common picks: rent, transit, gym, subscriptions."
      />

      {/* Active rows */}
      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {active.map((e) => (
            <ExpenseRow
              key={e.id}
              item={e}
              onAmount={(v) => updateAmount(e.id, v)}
              onRemove={() => remove(e.id)}
            />
          ))}
        </div>
      )}

      {/* Quick-add chips */}
      {inactive.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
          {inactive.map((c) => (
            <button
              key={c}
              type="button"
              className="neg-chip"
              onClick={() => addCategory(c)}
            >
              + {c}
            </button>
          ))}
        </div>
      )}

      {/* Custom entry */}
      <div style={{
        display: "flex", gap: 8, alignItems: "stretch",
        padding: 8, borderRadius: 12, background: "var(--surface-2)",
        border: "1px dashed var(--border-strong)",
        marginBottom: 14,
      }}>
        <input
          className="neg-field"
          placeholder="Something else? Type it here — e.g. Hobbies"
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addCategory(customDraft); setCustomDraft(""); }
          }}
          style={{ flex: 1, background: "var(--surface)" }}
        />
        <button
          type="button"
          className="neg-btn neg-btn-ghost"
          onClick={() => { addCategory(customDraft); setCustomDraft(""); }}
          disabled={!customDraft.trim()}
          style={{ flex: "0 0 auto" }}
        >
          Add
        </button>
      </div>

      {/* Running total / error */}
      {errors._ && <div className="neg-error" style={{ marginBottom: 8 }}>{errors._}</div>}
      {active.length > 0 && (
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--primary-soft)",
          borderRadius: 10,
          color: "var(--primary-ink)",
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Running total
          </span>
          <span className="neg-num" style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: 22,
            fontVariantNumeric: "tabular-nums",
          }}>
            {fmtMoney(total)}<span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>/mo</span>
          </span>
        </div>
      )}
    </section>
  );
}

// ── Single expense row: label, amount, delete (date removed) ─────────────────
function ExpenseRow({ item, onAmount, onRemove }) {
  return (
    <div style={{
      padding: 10,
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10,
    }}>
      <span style={{
        fontSize: 14, fontWeight: 600, color: "var(--text)",
        flex: "1 1 140px", minWidth: 0,
      }}>
        {item.label}
      </span>

      <div style={{ position: "relative", flex: "0 1 130px" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--muted)", fontSize: 13, pointerEvents: "none",
        }}>$</span>
        <input
          className="neg-field neg-num"
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={item.amount}
          onChange={(ev) => onAmount(ev.target.value)}
          style={{ paddingLeft: 22, paddingRight: 36, fontWeight: 600, height: 36 }}
          aria-label={`Amount for ${item.label}`}
        />
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--muted)", fontSize: 11, pointerEvents: "none",
        }}>/mo</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.label}`}
        style={{
          width: 32, height: 32, border: 0, background: "transparent",
          color: "var(--muted)", cursor: "pointer", borderRadius: 8, fontSize: 18, lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

Object.assign(window, {
  BlockHeader, BlockYou, BlockMoneyIn, BlockExpenses, ExpenseRow, COMMON_EXPENSES,
});
