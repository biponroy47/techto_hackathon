// shared.jsx — UI primitives + tone-aware copy + helpers.

// ── Copy by tone ─────────────────────────────────────────────────────────────
const COPY = {
  friendly: {
    appKicker: "Welcome to Nestegg",
    heroPre: "Let's build your ",
    heroSerif: "money picture",
    heroPost: ".",
    heroSub: "A few quick questions so we can shape budgets and tips that actually fit your life. Takes about 3 minutes — you can edit anything later.",
    secAbout: { title: "About you", sub: "The basics — just for personalization." },
    secWork:  { title: "Work & income", sub: "Whatever's accurate today. Future-you will thank present-you." },
    secBudget: { title: "Monthly budget", sub: "A target to stay within. We'll suggest one based on your income." },
    secExpenses: { title: "Monthly expenses", sub: "Tap the categories you have. We won't judge the coffee line item." },
    secUpcoming: { title: "Coming up", sub: "Concerts, tuition, that trip — anything you're saving toward or dreading." },
    secAccounts: { title: "Your accounts", sub: "Just rough balances and where they live. No logins, ever." },
    save: "Save & continue",
    saveLast: "Finish setup",
    skip: "Skip for now",
    cont: "Continue",
    back: "Back",
    edit: "Edit",
    addExpense: "+ Add custom category",
    addUpcoming: "+ Add upcoming expense",
    addAccount: "+ Add another account",
    gentleNudge: "Tiny wins compound. Even $25/mo at 22 turns into something real by 30.",
  },
  encouraging: {
    appKicker: "Welcome ✨",
    heroPre: "You're already ",
    heroSerif: "ahead",
    heroPost: " of the curve.",
    heroSub: "Most people your age haven't thought about any of this yet. The next 3 minutes will pay off for years.",
    secAbout: { title: "First, the basics", sub: "Just so we know who we're talking to." },
    secWork:  { title: "What you do", sub: "Working, studying, hustling — it all counts." },
    secBudget: { title: "Your target", sub: "Setting one is half the battle. We'll help you keep it." },
    secExpenses: { title: "Where it goes", sub: "Awareness first. Change later. Be honest with yourself." },
    secUpcoming: { title: "On the horizon", sub: "Knowing now means we can quietly start setting aside." },
    secAccounts: { title: "Your money's homes", sub: "Every account you add unlocks better advice." },
    save: "Looks good →",
    saveLast: "I'm done 🎉",
    skip: "I'll do this later",
    cont: "I'm with you →",
    back: "Back",
    edit: "Edit",
    addExpense: "+ Add my own",
    addUpcoming: "+ Add another",
    addAccount: "+ Add another",
    gentleNudge: "You don't have to be perfect. You just have to be honest with yourself.",
  },
  direct: {
    appKicker: "Onboarding",
    heroPre: "Set up your ",
    heroSerif: "profile",
    heroPost: ".",
    heroSub: "Required information for personalized recommendations. ~3 minutes. Editable from settings.",
    secAbout: { title: "Personal", sub: "Required for personalization." },
    secWork:  { title: "Employment & income", sub: "Used to size targets." },
    secBudget: { title: "Budget target", sub: "Set a monthly spending cap." },
    secExpenses: { title: "Monthly expenses", sub: "Select applicable categories with amounts." },
    secUpcoming: { title: "Upcoming expenses", sub: "One-time or recurring items in the next 12 months." },
    secAccounts: { title: "Accounts", sub: "Balances only. Credentials are never collected." },
    save: "Save",
    saveLast: "Complete setup",
    skip: "Skip",
    cont: "Continue",
    back: "Back",
    edit: "Edit",
    addExpense: "+ Add category",
    addUpcoming: "+ Add expense",
    addAccount: "+ Add account",
    gentleNudge: "Median subscription spend in this cohort: $42/mo across 4.1 services.",
  },
};

function useCopy(tone) {
  return COPY[tone] || COPY.friendly;
}

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = 28, showWordmark = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div
        style={{
          width: size, height: size, borderRadius: size * 0.3,
          background: "var(--primary)",
          color: "#fff",
          display: "grid", placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700, fontSize: size * 0.5, letterSpacing: "-0.02em",
          boxShadow: "0 4px 12px -4px var(--primary)",
          position: "relative", overflow: "hidden", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,.45), transparent 60%)",
        }} />
        <span style={{ position: "relative", zIndex: 1 }}>n</span>
      </div>
      {showWordmark && (
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600, fontSize: size * 0.62,
          letterSpacing: "-0.02em", color: "var(--text)",
        }}>
          Nestegg
        </span>
      )}
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
// Always shows inline help below the input. Optional aux label on the right
// (e.g., "Optional"). Prefix/suffix for currency, unit, etc.
function Field({
  label, aux, hint, prefix, suffix, type = "text",
  placeholder, value, onChange, inputMode, autoComplete,
  numeric, min, max, style, fieldStyle, error, required,
}) {
  return (
    <label style={{ display: "block", ...style }}>
      <span className="neg-label">
        <span>
          {label}
          {required && <span className="neg-required" aria-label="required">*</span>}
        </span>
        {aux && <span className="neg-label-aux">{aux}</span>}
      </span>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", fontWeight: 500, fontSize: 15, pointerEvents: "none",
            fontFamily: numeric ? "var(--font-num)" : "var(--font-body)",
          }}>{prefix}</span>
        )}
        <input
          className={"neg-field" + (numeric ? " neg-num" : "")}
          data-error={error ? "1" : undefined}
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          inputMode={inputMode || (numeric ? "decimal" : undefined)}
          autoComplete={autoComplete}
          min={min} max={max}
          aria-invalid={error ? "true" : undefined}
          style={{
            paddingLeft: prefix ? 30 : 14,
            paddingRight: suffix ? 56 : 14,
            ...fieldStyle,
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", fontSize: 13, pointerEvents: "none",
            fontWeight: 500,
          }}>{suffix}</span>
        )}
      </div>
      {error ? (
        <div className="neg-error">{error}</div>
      ) : hint ? (
        <div className="neg-hint">{hint}</div>
      ) : null}
    </label>
  );
}

// ── Select (custom-styled native) ────────────────────────────────────────────
function Select({ label, aux, hint, value, onChange, options, style, error, required }) {
  return (
    <label style={{ display: "block", ...style }}>
      <span className="neg-label">
        <span>
          {label}
          {required && <span className="neg-required" aria-label="required">*</span>}
        </span>
        {aux && <span className="neg-label-aux">{aux}</span>}
      </span>
      <div style={{ position: "relative" }}>
        <select
          className="neg-field"
          data-error={error ? "1" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          style={{
            appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
            paddingRight: 36, cursor: "pointer",
          }}
        >
          {options.map((o) => {
            const v = typeof o === "object" ? o.value : o;
            const l = typeof o === "object" ? o.label : o;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      </div>
      {error ? (
        <div className="neg-error">{error}</div>
      ) : hint ? (
        <div className="neg-hint">{hint}</div>
      ) : null}
    </label>
  );
}

// ── ChipGroup (controlled, single or multi) ──────────────────────────────────
function ChipGroup({ options, value, onChange, multi = false }) {
  const isOn = (v) =>
    multi ? Array.isArray(value) && value.includes(v) : value === v;
  const toggle = (v) => {
    if (!onChange) return;
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        const on = isOn(v);
        return (
          <button
            key={v}
            type="button"
            className="neg-chip"
            data-on={on ? "1" : "0"}
            onClick={() => toggle(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── Pill toggle (2-state segmented) ──────────────────────────────────────────
function PillToggle({ options, value, onChange }) {
  const idx = Math.max(0, options.findIndex((o) => (typeof o === "object" ? o.value : o) === value));
  return (
    <div className="neg-pill-toggle" role="radiogroup">
      <span
        className="neg-pill-thumb"
        style={{
          left: `calc(3px + ${idx} * (100% - 6px) / ${options.length})`,
          width: `calc((100% - 6px) / ${options.length})`,
        }}
      />
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            data-on={value === v ? "1" : "0"}
            aria-checked={value === v}
            onClick={() => onChange && onChange(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── Display heading mixing serif + sans ──────────────────────────────────────
function MixedHeading({ pre, serif, post, size = 32, style }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-display)",
      fontWeight: 600, fontSize: size, letterSpacing: "-0.025em",
      lineHeight: 1.08, margin: 0, color: "var(--text)",
      textWrap: "balance",
      ...style,
    }}>
      {pre}
      {serif && (
        <span style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic", fontWeight: 400,
          letterSpacing: "var(--serif-tight)",
        }}>
          {serif}
        </span>
      )}
      {post}
    </h2>
  );
}

// ── Guidance callout ─────────────────────────────────────────────────────────
function GuidanceCallout({ children, kind = "tip" }) {
  return (
    <div className="neg-guidance neg-guidance-bold" style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "14px 16px",
      background: "var(--accent-soft)",
      borderRadius: 12,
      border: "1px solid color-mix(in oklab, var(--accent) 28%, transparent)",
      fontSize: 13.5, lineHeight: 1.5, color: "var(--accent-ink)",
    }}>
      <span style={{
        flexShrink: 0,
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 16, fontWeight: 500,
        letterSpacing: "var(--serif-tight)",
        color: "var(--accent-ink)",
        lineHeight: 1.1, marginTop: -1,
      }}>
        {kind === "tip" ? "Tip" : "FYI"}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

// ── Currency formatter ───────────────────────────────────────────────────────
function fmtMoney(n, currency = "$") {
  if (n === "" || n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return currency + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

Object.assign(window, {
  COPY, useCopy, Logo, Field, Select, ChipGroup, PillToggle,
  MixedHeading, GuidanceCallout, fmtMoney,
});
