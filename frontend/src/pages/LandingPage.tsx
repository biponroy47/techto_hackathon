import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MessageSquareText, ShieldCheck, WalletCards } from "lucide-react";
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
      <div className="hero-panel">
        <p className="eyebrow">Finance Consultant</p>
        <h1>Turn your financial picture into a plan you can actually follow.</h1>
        <p>
          Build a personal profile, save it to your account, and chat with an AI
          consultant that understands your income, costs, goals, and upcoming expenses.
        </p>
        <div className="hero-actions">
          <Link to={primaryDestination} className="primary-button">
            <ArrowRight aria-hidden="true" />
            {isSupabaseConfigured && !user ? "Create account" : "Start onboarding"}
          </Link>
          <Link to="/auth" className="secondary-button">
            Log in
          </Link>
        </div>
      </div>

      <div className="landing-summary">
        <div className="summary-header">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Hackathon-safe demo</strong>
            <span>Use sample data, not real bank credentials or account numbers.</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Flow</dt>
            <dd>Account to onboarding to chat</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>Supabase profile per user</dd>
          </div>
          <div>
            <dt>AI</dt>
            <dd>Groq-backed consultant API</dd>
          </div>
        </dl>
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
    </section>
  );
}
