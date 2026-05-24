import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface BalanceCardProps {
  totalBalance: number;
  income: number;
  expenses: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export function BalanceCard({ totalBalance, income, expenses }: BalanceCardProps) {
  return (
    <div className="dash-card dash-card--orange dash-col-4">
      <div>
        <p className="dash-label" style={{ color: "rgba(255,255,255,0.7)" }}>
          Total Balance
        </p>
        <p className="dash-hero-number">{fmt(totalBalance)}</p>
      </div>

      <div className="dash-row" style={{ gap: 12, marginTop: 24 }}>
        <div className="dash-sub-card">
          <div className="dash-row" style={{ gap: 4, marginBottom: 4 }}>
            <ArrowUpRight size={12} style={{ color: "rgba(255,255,255,0.7)" }} aria-hidden />
            <span className="dash-sublabel">Income</span>
          </div>
          <p className="dash-sub-number">{fmt(income)}</p>
        </div>

        <div className="dash-sub-card">
          <div className="dash-row" style={{ gap: 4, marginBottom: 4 }}>
            <ArrowDownRight size={12} style={{ color: "rgba(255,255,255,0.7)" }} aria-hidden />
            <span className="dash-sublabel">Spent</span>
          </div>
          <p className="dash-sub-number">{fmt(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
