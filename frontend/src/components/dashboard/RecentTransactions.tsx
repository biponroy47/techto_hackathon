import type { LucideIcon } from "lucide-react";

export interface Transaction {
  id: number;
  label: string;
  amount: number;
  icon: LucideIcon;
  category: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export function RecentTransactions({ transactions, onSeeAll }: RecentTransactionsProps) {
  return (
    <div className="dash-card dash-col-4">
      <div className="dash-row" style={{ marginBottom: 16 }}>
        <h2 className="dash-section-title">Recent Transactions</h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "#E9631A",
              cursor: "pointer",
            }}
          >
            See all
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {transactions.map((t) => {
          const Icon = t.icon;
          const isPos = t.amount > 0;
          return (
            <div key={t.id} className="dash-txn-row">
              <div
                className="dash-txn-icon"
                style={{ background: isPos ? "#E9631A" : "#EBEBDF" }}
              >
                <Icon
                  size={16}
                  style={{ color: isPos ? "#fff" : "#1c1a18" }}
                  aria-hidden
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1c1a18",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "#6b6358" }}>
                  {t.date}
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  color: isPos ? "#E9631A" : "#1c1a18",
                }}
              >
                {isPos ? "+" : "-"}
                {fmt(t.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
