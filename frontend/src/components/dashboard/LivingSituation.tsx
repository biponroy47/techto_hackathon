import type { LucideIcon } from "lucide-react";

export interface SituationItem {
  icon: LucideIcon;
  label: string;
  active: boolean;
}

interface LivingSituationProps {
  items: SituationItem[];
}

export function LivingSituation({ items }: LivingSituationProps) {
  return (
    <div className="dash-card dash-card--orange dash-col-4">
      <h2
        className="dash-section-title"
        style={{ color: "rgba(255,255,255,0.85)", marginBottom: 4 }}
      >
        Living Situation
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 16px" }}>
        Your setup from onboarding
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {items.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 12,
              padding: "8px 12px",
              background: active ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.08)",
            }}
          >
            <Icon
              size={14}
              style={{ color: active ? "#fff" : "rgba(255,255,255,0.4)", flexShrink: 0 }}
              aria-hidden
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: active ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
