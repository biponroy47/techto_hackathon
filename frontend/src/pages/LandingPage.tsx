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
    title: "Profile-aware planning",
    copy: "Collect income, fixed costs, debts, subscriptions, and goals in one guided onboarding flow."
  },
  {
    icon: MessageSquareText,
    title: "AI budget consultant",
    copy: "Ask practical questions about saving, budgeting, upcoming trips, and expense tradeoffs."
  },
  {
    icon: CalendarDays,
    title: "Built for the next step",
    copy: "The structure is ready for transaction uploads and calendar-based cashflow views."
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const primaryDestination = isSupabaseConfigured && !user ? "/auth" : "/onboarding";

  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div className="hero-panel">
          <p className="eyebrow">AI Finance Consultant</p>
          <h1>Plan your money with a calm, personal AI advisor.</h1>
          <p>
            Create a secure financial profile, understand your monthly cash flow,
            and get practical guidance for budgets, trips, subscriptions, and saving goals.
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

        <div className="finance-visual" aria-label="Animated finance consultant preview">
          <div className="visual-card advisor-card">
            <div className="card-title">
              <Sparkles aria-hidden="true" />
              AI Consultant
            </div>
            <div className="chat-bubble user-bubble">Can I afford a $1,200 trip?</div>
            <div className="chat-bubble agent-bubble">
              Save $300/month and trim $90 from flexible spending.
            </div>
          </div>

          <div className="visual-card calculator-card">
            <div className="card-title">
              <ChartNoAxesCombined aria-hidden="true" />
              Monthly snapshot
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
              Upcoming costs
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
              Saving tip
            </div>
            <p>Move $75 weekly into a trip fund after payday.</p>
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
            <strong>Privacy-minded demo flow</strong>
            <span>Use sample data for testing. Avoid real bank credentials or account numbers.</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Account</dt>
            <dd>Save a profile with Supabase</dd>
          </div>
          <div>
            <dt>Analysis</dt>
            <dd>Estimate income, costs, and goals</dd>
          </div>
          <div>
            <dt>Advice</dt>
            <dd>Ask the Groq-backed consultant</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
