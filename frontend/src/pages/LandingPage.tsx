import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  MessageSquareText,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../lib/supabaseClient";

const featureCards = [
  {
    icon: WalletCards,
    title: "See the whole horizon",
    copy: "Bring income, cash flow, debts, subscriptions, and goals together in one personal profile."
  },
  {
    icon: MessageSquareText,
    title: "Guidance when you need it",
    copy: "Ask questions about budgeting, saving, debt payoff, upcoming costs, and future life goals."
  },
  {
    icon: CalendarDays,
    title: "Plan ahead with confidence",
    copy: "Understand monthly expenses, upcoming payments, and the habits that move you forward."
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const primaryDestination = isSupabaseConfigured && !user ? "/auth" : "/onboarding";

  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div className="hero-panel">
          <p className="eyebrow">FiHo - Financial Horizon</p>
          <h1>Your personal financial advisor for the life you want next.</h1>
          <p>
            FiHo helps you understand your cash flow, budget with intention, manage debts,
            save for future goals, and make clearer financial decisions as your life changes.
          </p>
          <div className="hero-actions">
            <Link to={primaryDestination} className="primary-button">
              <ArrowRight aria-hidden="true" />
              {isSupabaseConfigured && !user ? "Create account" : "Start planning"}
            </Link>
            <Link to="/auth" className="secondary-button">
              Log in
            </Link>
          </div>
        </div>

        <div className="finance-visual" aria-label="Animated FiHo financial guidance preview">
          <div className="visual-card advisor-card">
            <div className="card-title">
              <Sparkles aria-hidden="true" />
              FiHo Advisor
            </div>
            <div className="chat-bubble user-bubble">How do I save for a $1,200 trip?</div>
            <div className="chat-bubble agent-bubble">
              Set aside $300/month and reduce flexible spending by $90.
            </div>
          </div>

          <div className="visual-card calculator-card">
            <div className="card-title">
              <ChartNoAxesCombined aria-hidden="true" />
              Cash flow scan
            </div>
            <div className="cost-row">
              <span>Income</span>
              <strong>$3,200</strong>
            </div>
            <div className="cost-row">
              <span>Fixed costs</span>
              <strong>$1,760</strong>
            </div>
            <div className="cost-row">
              <span>Left to plan</span>
              <strong>$1,440</strong>
            </div>
            <div className="progress-track">
              <span className="progress-fill" />
            </div>
          </div>

          <div className="visual-card calendar-card">
            <div className="card-title">
              <CalendarDays aria-hidden="true" />
              Financial horizon
            </div>
            <div className="mini-calendar">
              {["Rent", "Pay", "Trip", "Loan"].map((item) => (
                <div key={item} className="calendar-chip">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="visual-card tip-card">
            <div className="card-title">
              <PiggyBank aria-hidden="true" />
              Goal guidance
            </div>
            <p>Move $75 weekly after payday toward your next major goal.</p>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        {featureCards.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="feature-card">
              <Icon aria-hidden="true" />
              <h2>{feature.title}</h2>
              <p>{feature.copy}</p>
            </article>
          );
        })}
      </div>

      <div className="landing-summary">
        <div className="summary-header">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Personal guidance, grounded in your context</strong>
            <span>FiHo uses your profile to give clearer budgeting, cash flow, debt, and savings guidance.</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Profile</dt>
            <dd>Build your financial picture</dd>
          </div>
          <div>
            <dt>Cash flow</dt>
            <dd>Track income, costs, and timing</dd>
          </div>
          <div>
            <dt>Guidance</dt>
            <dd>Get next steps for future goals</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
