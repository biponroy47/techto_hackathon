// app.jsx — single-page ~30 second onboarding.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "atomic",
  "fonts": "montserrat-calibri",
  "density": "regular",
  "tone": "friendly",
  "guidance": "on"
}/*EDITMODE-END*/;

// ── Theme swatches for Tweaks ────────────────────────────────────────────────
const THEMES = [
  { id: "atomic",    name: "Atomic",    hero: "#e9631a", surface: "#d9ceb8", accent: "#ebebdf" },
  { id: "warm-blue", name: "Warm blue", hero: "#2f5bea", surface: "#f3f5fa", accent: "#f4946a" },
  { id: "coral",     name: "Coral",     hero: "#d3553a", surface: "#fbf5f1", accent: "#2a6f6a" },
  { id: "mint",      name: "Mint",      hero: "#1f7a52", surface: "#f1f6f2", accent: "#c98a17" },
  { id: "midnight",  name: "Midnight",  hero: "#88a8ff", surface: "#0e1426", accent: "#ffb079" },
  { id: "paper",     name: "Paper",     hero: "#1a1815", surface: "#f5f3ec", accent: "#c44a2c" },
];

function ThemeChips({ value, onChange }) {
  return (
    <TweakRow label="Color">
      <div className="twk-chips" role="radiogroup">
        {THEMES.map((th) => {
          const on = th.id === value;
          return (
            <button
              key={th.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="twk-chip"
              data-on={on ? "1" : "0"}
              title={th.name}
              aria-label={th.name}
              style={{ background: th.hero }}
              onClick={() => onChange(th.id)}
            >
              <span>
                <i style={{ background: th.surface }} />
                <i style={{ background: th.accent }} />
              </span>
              {on && (
                <svg viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" stroke="#fff" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

// ── Validation (single pass on submit) ───────────────────────────────────────
function validate(data) {
  const errors = { about: {}, work: {}, expenses: {} };
  if (!data.about.name || !data.about.name.trim()) errors.about.name = "Your name is required.";
  if (!data.about.age || String(data.about.age).trim() === "") errors.about.age = "Your age is required.";
  else {
    const n = Number(data.about.age);
    if (!Number.isFinite(n) || n < 13) errors.about.age = "Must be 13 or older.";
    else if (n > 120) errors.about.age = "Hmm, that doesn't look right.";
  }
  if (!data.work.income || String(data.work.income).trim() === "") errors.work.income = "Take-home pay is required.";
  else if (!(Number(data.work.income) > 0)) errors.work.income = "Must be more than zero.";
  if (!data.expenses || data.expenses.length === 0) {
    errors.expenses._ = "Add at least one recurring expense.";
  } else {
    const missingAmount = data.expenses.some((e) => !e.amount || !(Number(e.amount) > 0));
    if (missingAmount) errors.expenses._ = "Fill in an amount for each, or remove the empty ones.";
  }
  // Strip empty blocks
  const out = {};
  for (const k of Object.keys(errors)) {
    if (Object.keys(errors[k]).length) out[k] = errors[k];
  }
  return out;
}

// ── Backend payload (schema v2, much simpler) ────────────────────────────────
function toPayload(data) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    schemaVersion: 2,
    submittedAt: new Date().toISOString(),
    profile: {
      firstName: (data.about.name || "").trim(),
      age: data.about.age ? num(data.about.age) : null,
      livingArrangement: data.about.living || null,
    },
    income: {
      monthlyTakeHome: num(data.work.income),
      payFrequency: data.work.frequency || "monthly",
    },
    recurringMonthlyExpenses: data.expenses.map((e) => ({
      id: String(e.id),
      category: e.label,
      amount: num(e.amount),
    })),
  };
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const copy = useCopy(t.tone);

  const [data, setRawData] = React.useState({
    about: { name: "", age: "", living: "" },
    work: { income: "", frequency: "monthly" },
    expenses: [],
  });
  const setData = React.useCallback((patch) => {
    setRawData((d) => ({ ...d, ...patch }));
  }, []);
  const setBlock = React.useCallback((key) => (patch) => {
    setRawData((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const [errors, setErrors] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [completion, setCompletion] = React.useState(false);

  // When expenses change, clear errors
  React.useEffect(() => {
    setErrors((e) => {
      if (!e.expenses) return e;
      const next = { ...e };
      delete next.expenses;
      return next;
    });
  }, [data.expenses]);

  const handleSubmit = () => {
    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error block
      requestAnimationFrame(() => {
        const firstKey = Object.keys(errs)[0];
        const el = document.querySelector(`[data-block="${firstKey}"]`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
      return;
    }
    setErrors({});
    setSubmitted(true);
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-block="summary"]');
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  };

  const finish = () => setCompletion(true);

  const reset = () => {
    setRawData({
      about: { name: "", age: "", living: "" },
      work: { income: "", frequency: "monthly" },
      expenses: [],
    });
    setErrors({});
    setSubmitted(false);
    setCompletion(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Expose payload for Tweaks "Download JSON" action
  const currentPayload = React.useMemo(() => toPayload(data), [data]);
  React.useEffect(() => { window.__neg_currentPayload = currentPayload; }, [currentPayload]);

  // Edit links in summary jump back up to their block
  const editJump = (blockId) => {
    setSubmitted(false);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-block="${blockId}"]`);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (completion) {
    return (
      <div
        className="neg-root"
        data-theme={t.theme}
        data-fonts={t.fonts}
        data-density={t.density}
        data-guidance={t.guidance}
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
      >
        <div className="neg-card neg-fade-in" style={{
          padding: "clamp(28px, 6vw, 56px)",
          maxWidth: 520, width: "100%", textAlign: "center",
          background: "linear-gradient(135deg, var(--primary-soft), var(--accent-soft))",
          border: "1px solid color-mix(in oklab, var(--primary) 22%, transparent)",
        }}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <Logo size={36} />
          </div>
          <MixedHeading
            pre="Welcome aboard, "
            serif={(data.about.name.trim().split(" ")[0] || "friend")}
            post="."
            size="clamp(28px, 5vw, 40px)"
          />
          <p style={{
            fontSize: 16, color: "var(--text-soft)", lineHeight: 1.5,
            margin: "16px auto 24px", maxWidth: 400, textWrap: "pretty",
          }}>
            Your dashboard is being prepared. This is where you'd land in the real app —
            for the prototype, click below to go back to onboarding.
          </p>
          <button type="button" className="neg-btn" onClick={reset}>
            Back to start
          </button>
        </div>
        <TweaksPanelEl t={t} setTweak={setTweak} reset={reset} />
      </div>
    );
  }

  return (
    <div
      className="neg-root"
      data-theme={t.theme}
      data-fonts={t.fonts}
      data-density={t.density}
      data-guidance={t.guidance}
      style={{ minHeight: "100vh", paddingBottom: 80 }}
    >
      {/* Top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          padding: "12px 24px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <Logo size={26} />
          <div style={{ flex: 1 }} />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.12em",
            color: "var(--muted)",
            display: "inline-flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: 999,
              background: "var(--primary)",
            }} />
            Quick setup · ~30 sec
          </span>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 20px" }}>
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: "var(--primary)",
          textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12,
        }}>
          Welcome to Nestegg
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "clamp(34px, 7vw, 58px)",
          letterSpacing: "-0.035em",
          lineHeight: 1.02,
          color: "var(--text)",
          margin: 0,
        }}>
          Tell us a few things.<br/>
          <span style={{ color: "var(--primary)" }}>We'll do the rest.</span>
        </h1>
        <p style={{
          fontSize: "clamp(14.5px, 1.8vw, 16.5px)",
          color: "var(--text-soft)",
          lineHeight: 1.5, margin: "14px 0 0", maxWidth: 520, textWrap: "pretty",
        }}>
          Three quick sections, all on this page. Rough numbers are fine — you can polish anything later from settings.
        </p>
      </section>

      {/* Single-page form */}
      <main style={{
        maxWidth: 720, margin: "0 auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 36,
      }}>
        <div data-block="about" className="neg-card" style={{ padding: "var(--pad-card)" }}>
          <BlockYou
            data={data.about}
            set={setBlock("about")}
            errors={errors.about || {}}
          />
        </div>

        <div data-block="work" className="neg-card" style={{ padding: "var(--pad-card)" }}>
          <BlockMoneyIn
            data={data.work}
            set={setBlock("work")}
            errors={errors.work || {}}
          />
        </div>

        <div data-block="expenses" className="neg-card" style={{ padding: "var(--pad-card)" }}>
          <BlockExpenses
            data={data}
            set={setData}
            errors={errors.expenses || {}}
          />
        </div>

        {/* Finish button */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          padding: "8px 0",
        }}>
          <button
            type="button"
            className="neg-btn"
            onClick={handleSubmit}
            style={{
              height: 58,
              paddingInline: 32,
              fontSize: 17, fontWeight: 700,
              borderRadius: 14,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              flex: "1 1 auto",
              minWidth: 220,
            }}
          >
            {submitted ? "Refresh my picture" : "See my picture →"}
          </button>
          {!submitted && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Required: name, age, take-home, at least one expense.
            </span>
          )}
        </div>

        {/* Summary appears below after submission */}
        {submitted && (
          <div data-block="summary" style={{ marginTop: 16 }}>
            <OnboardingSummary
              data={data}
              copy={copy}
              onEdit={editJump}
              onFinish={finish}
              payload={currentPayload}
            />
          </div>
        )}
      </main>

      <TweaksPanelEl t={t} setTweak={setTweak} reset={reset} />
    </div>
  );
}

// Reused on the completion screen too.
function TweaksPanelEl({ t, setTweak, reset }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <ThemeChips value={t.theme} onChange={(v) => setTweak("theme", v)} />

      <TweakSelect
        label="Font pairing"
        value={t.fonts}
        options={[
          { value: "montserrat-calibri", label: "Montserrat + Calibri" },
          { value: "jakarta-serif",     label: "Jakarta + Instrument Serif" },
          { value: "dmsans-fraunces",   label: "DM Sans + Fraunces" },
          { value: "manrope-lora",      label: "Manrope + Lora" },
          { value: "ibm-plex",          label: "IBM Plex Sans + Serif + Mono" },
          { value: "geist-mono",        label: "Geist + Geist Mono" },
        ]}
        onChange={(v) => setTweak("fonts", v)}
      />

      <TweakSection label="Layout" />
      <TweakRadio
        label="Density"
        value={t.density}
        options={["compact", "regular", "comfy"]}
        onChange={(v) => setTweak("density", v)}
      />

      <TweakSection label="Voice" />
      <TweakSelect
        label="Microcopy tone"
        value={t.tone}
        options={[
          { value: "friendly",    label: "Friendly & casual" },
          { value: "encouraging", label: "Encouraging coach" },
          { value: "direct",      label: "Direct & efficient" },
        ]}
        onChange={(v) => setTweak("tone", v)}
      />

      <TweakRadio
        label="Guidance"
        value={t.guidance}
        options={[
          { value: "off",    label: "Off" },
          { value: "subtle", label: "Subtle" },
          { value: "on",     label: "On" },
        ]}
        onChange={(v) => setTweak("guidance", v)}
      />

      <TweakSection label="Actions" />
      <TweakButton
        label="Download data as JSON"
        onClick={() => {
          const payload = window.__neg_currentPayload;
          if (!payload) return;
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `nestegg-onboarding-${(payload.profile.firstName || "user").toLowerCase() || "user"}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
      <TweakButton label="Reset onboarding" secondary onClick={reset} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
