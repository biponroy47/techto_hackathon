// onboarding-summary.jsx — editorial summary card shown after submit.
// Simpler now: name/age/living + income + recurring expenses.

function OnboardingSummary({ data, copy, onEdit, onFinish, payload }) {
  // ── Pull and normalize ─────────────────────────────────────────────────────
  const firstName = (data.about.name || "").trim().split(/\s+/)[0] || "friend";
  const age = data.about.age;
  const living = (data.about.living || "").toLowerCase();

  const income = Number(data.work.income) || 0;
  const frequency = data.work.frequency || "monthly";
  const expensesTotal = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Normalize income to monthly for the math line
  const monthlyIncome =
    frequency === "weekly"   ? income * 52 / 12 :
    frequency === "biweekly" ? income * 26 / 12 :
    frequency === "annual"   ? income / 12 :
    income; // monthly or variable
  const leftover = Math.max(0, monthlyIncome - expensesTotal);

  const freqLabel = {
    monthly: "a month",
    biweekly: "every two weeks",
    weekly: "a week",
    annual: "a year",
    variable: "in a typical month",
  }[frequency] || "a month";

  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).toUpperCase();

  // ── Compose concise prose ──────────────────────────────────────────────────
  const livingClause = living ? `, ${living}` : "";
  const ageClause = age ? `${age}` : "";
  const whoLine =
    ageClause && livingClause
      ? `You're ${ageClause}${livingClause}, bringing home ${fmtMoney(income)} ${freqLabel}.`
      : ageClause
      ? `You're ${ageClause}, bringing home ${fmtMoney(income)} ${freqLabel}.`
      : `You're bringing home ${fmtMoney(income)} ${freqLabel}.`;

  const top3 = [...data.expenses]
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 3)
    .map((e) => e.label.replace(/\s*\/\s*\w+$/, "").toLowerCase());
  const spendLine = top3.length > 0
    ? `Each month, around ${fmtMoney(expensesTotal)} goes out on ${listToProse(top3)}${data.expenses.length > 3 ? ", and a few others" : ""}.`
    : `We've got your recurring expenses logged — about ${fmtMoney(expensesTotal)} a month.`;

  const leftoverLine = monthlyIncome > 0
    ? `That leaves roughly ${fmtMoney(leftover)} a month to actually do something with.`
    : "";

  // ── JSON export state ──────────────────────────────────────────────────────
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const jsonString = React.useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* clipboard blocked */ }
  };
  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nestegg-onboarding-${(firstName || "user").toLowerCase()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <article style={{
      position: "relative",
      background: "var(--surface-2)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-card)",
      padding: "clamp(24px, 5vw, 52px) clamp(20px, 5vw, 52px)",
      overflow: "hidden",
      boxShadow: "0 1px 0 rgba(31,26,20,.03), 0 24px 60px -20px rgba(31,26,20,.18)",
    }}>
      {/* Decorative orange top stripe */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 6,
        background: "linear-gradient(90deg, var(--primary) 0%, var(--primary) 60%, var(--accent) 100%)",
      }} />

      {/* Decorative rotated stamp */}
      <Stamp />

      {/* Tiny masthead */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "var(--font-display)",
        fontSize: 10.5, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.18em",
        color: "var(--text-soft)",
        position: "relative", zIndex: 1,
        flexWrap: "wrap",
        paddingRight: 100,
      }}>
        <span style={{ color: "var(--primary)" }}>★ Nestegg</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>Issue No. 01</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{dateLabel}</span>
      </div>

      {/* Massive headline */}
      <div style={{ marginTop: 24, position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "clamp(40px, 10vw, 92px)",
          letterSpacing: "-0.045em",
          lineHeight: 0.94,
          color: "var(--text)",
          margin: 0,
        }}>
          Hi {firstName}.
        </h2>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "clamp(40px, 10vw, 92px)",
          letterSpacing: "-0.045em",
          lineHeight: 0.94,
          color: "var(--primary)",
          margin: "4px 0 0",
        }}>
          We've got you.
        </h2>
      </div>

      {/* Editorial prose */}
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: "clamp(15.5px, 2vw, 18px)",
        lineHeight: 1.55,
        color: "var(--text)",
        maxWidth: 560,
        margin: "26px 0 0",
        textWrap: "pretty",
        position: "relative", zIndex: 1,
      }}>
        {whoLine} {spendLine} {leftoverLine}
      </p>

      {/* Pull-quote big numbers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))",
        gap: "clamp(18px, 4vw, 36px)",
        marginTop: 36,
        paddingTop: 26,
        borderTop: "1px solid var(--border)",
        position: "relative", zIndex: 1,
      }}>
        <BigNumber value={fmtMoney(monthlyIncome)} unit="/mo" label="coming in" />
        <BigNumber value={fmtMoney(expensesTotal)} unit="/mo" label="going out" />
        <BigNumber
          value={fmtMoney(leftover)}
          unit="/mo"
          label={leftover > monthlyIncome * 0.3 ? "breathing room" : leftover > 0 ? "to work with" : "tight"}
          highlight
        />
      </div>

      {/* CTA + JSON export */}
      <div style={{
        marginTop: 36,
        display: "flex", flexDirection: "column", alignItems: "stretch", gap: 16,
        position: "relative", zIndex: 1,
      }}>
        <button
          type="button"
          className="neg-btn"
          onClick={onFinish}
          style={{
            height: 58,
            paddingInline: 28,
            fontSize: 16.5, fontWeight: 700,
            borderRadius: 14,
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
            alignSelf: "flex-start",
            maxWidth: "100%",
          }}
        >
          Take me to my dashboard
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 9h11M9 3l6 6-6 6" />
          </svg>
        </button>

        {/* Backend payload panel */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <button
            type="button"
            onClick={() => setJsonOpen((v) => !v)}
            aria-expanded={jsonOpen}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "12px 16px",
              background: "transparent", border: 0, cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 14, color: "var(--text)",
              textAlign: "left",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                display: "inline-grid", placeItems: "center",
                width: 28, height: 28, borderRadius: 8,
                background: "var(--primary-soft)", color: "var(--primary-ink)",
                fontFamily: "ui-monospace, 'SF Mono', monospace",
                fontWeight: 800, fontSize: 12.5,
              }}>
                {`{ }`}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, color: "var(--text)" }}>
                  Backend payload
                </span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)" }}>
                  Normalized JSON · schema v2
                </span>
              </span>
            </span>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{
                transform: jsonOpen ? "rotate(180deg)" : "rotate(0)",
                transition: "transform .2s",
                color: "var(--muted)", flexShrink: 0,
              }}
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>

          {jsonOpen && (
            <div className="neg-fade-in" style={{ padding: "0 16px 16px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="neg-btn"
                  onClick={copyJson}
                  style={{ height: 34, paddingInline: 14, fontSize: 13, borderRadius: 8 }}
                >
                  {copied ? "Copied ✓" : "Copy JSON"}
                </button>
                <button
                  type="button"
                  className="neg-btn neg-btn-ghost"
                  onClick={downloadJson}
                  style={{ height: 34, paddingInline: 14, fontSize: 13, borderRadius: 8 }}
                >
                  Download .json
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                color: "var(--text)",
                overflow: "auto",
                maxHeight: 320,
                whiteSpace: "pre",
              }}>
                {jsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Edit links */}
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 13.5, color: "var(--muted)",
          lineHeight: 1.6,
        }}>
          Spot something off? Edit{" "}
          {SUMMARY_EDIT_LINKS.map((lk, i) => (
            <React.Fragment key={lk.id}>
              <button
                type="button"
                onClick={() => onEdit(lk.id)}
                style={{
                  background: "transparent", border: 0, padding: 0,
                  color: "var(--primary)",
                  fontFamily: "inherit", fontSize: "inherit",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationThickness: 1.5,
                  textUnderlineOffset: 3,
                }}
              >
                {lk.label}
              </button>
              {i < SUMMARY_EDIT_LINKS.length - 2 ? ", " : i === SUMMARY_EDIT_LINKS.length - 2 ? ", or " : ""}
            </React.Fragment>
          ))}
          .
        </div>
      </div>
    </article>
  );
}

const SUMMARY_EDIT_LINKS = [
  { id: "about",    label: "about you" },
  { id: "work",     label: "your income" },
  { id: "expenses", label: "your expenses" },
];

// ── BigNumber: typographic pull-quote ───────────────────────────────────────
function BigNumber({ value, unit, label, highlight }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontWeight: highlight ? 900 : 800,
        fontSize: "clamp(26px, 4.5vw, 42px)",
        letterSpacing: "-0.045em",
        lineHeight: 1,
        color: highlight ? "var(--primary)" : "var(--text)",
        fontFeatureSettings: "'tnum'",
        display: "flex", alignItems: "baseline", gap: 3,
      }}>
        <span>{value}</span>
        {unit && (
          <span style={{
            fontSize: "0.42em",
            fontWeight: 600,
            color: "var(--muted)",
            letterSpacing: "0",
          }}>
            {unit}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 10.5, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.14em",
        color: "var(--muted)",
        marginTop: 10,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Stamp: decorative rotated badge top-right ───────────────────────────────
function Stamp() {
  return (
    <div aria-hidden="true" style={{
      position: "absolute",
      top: "clamp(16px, 4vw, 32px)",
      right: "clamp(16px, 4vw, 32px)",
      width: 84, height: 84,
      borderRadius: "50%",
      border: "2.5px solid var(--primary)",
      color: "var(--primary)",
      display: "grid", placeItems: "center",
      transform: "rotate(-8deg)",
      fontFamily: "var(--font-display)",
      textAlign: "center",
      fontSize: 10, fontWeight: 800,
      letterSpacing: "0.14em",
      lineHeight: 1.25,
      opacity: 0.92,
      background: "color-mix(in oklab, var(--primary-soft) 65%, transparent)",
      zIndex: 0,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>★</div>
        READY<br/>TO<br/>ROLL
      </div>
    </div>
  );
}

// ── helper: ["a","b","c"] → "a, b and c" ────────────────────────────────────
function listToProse(arr) {
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
}

Object.assign(window, { OnboardingSummary, BigNumber, Stamp });
