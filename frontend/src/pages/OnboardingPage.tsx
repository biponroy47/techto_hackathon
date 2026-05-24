import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, Save } from "lucide-react";
import { clearProfile, emptyProfile, loadProfile, saveProfile } from "../lib/profileStorage";
import type { FinanceProfile } from "../types";

const fields: Array<{
  name: keyof FinanceProfile;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  {
    name: "occupation",
    label: "Occupation",
    placeholder: "Part-time cashier, software intern, student..."
  },
  {
    name: "status",
    label: "Current situation",
    placeholder: "Student, working full-time, between jobs..."
  },
  {
    name: "monthlyIncome",
    label: "Monthly income",
    placeholder: "2400"
  },
  {
    name: "housingCost",
    label: "Rent or housing cost",
    placeholder: "950"
  },
  {
    name: "subscriptions",
    label: "Subscriptions",
    placeholder: "Netflix $18, Spotify $11, gym $45",
    multiline: true
  },
  {
    name: "recurringExpenses",
    label: "Recurring expenses",
    placeholder: "Groceries, transit, phone bill, insurance...",
    multiline: true
  },
  {
    name: "debts",
    label: "Debts",
    placeholder: "Credit card, student loan, line of credit...",
    multiline: true
  },
  {
    name: "upcomingExpenses",
    label: "Upcoming expenses",
    placeholder: "Trip in August, tuition, laptop, moving costs...",
    multiline: true
  },
  {
    name: "savingsGoals",
    label: "Savings goals",
    placeholder: "Emergency fund, vacation, car, rent buffer...",
    multiline: true
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FinanceProfile>(() => loadProfile());

  function updateField(name: keyof FinanceProfile, value: string) {
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveProfile(profile);
    navigate("/chat");
  }

  function handleReset() {
    clearProfile();
    setProfile(emptyProfile);
  }

  return (
    <section className="page-grid">
      <div className="intro-panel">
        <p className="eyebrow">Step 1</p>
        <h1>Tell the app your financial picture.</h1>
        <p>
          Add enough detail for the consultant to understand your income,
          recurring costs, goals, and pressure points.
        </p>
        <div className="tip-box">
          <strong>Hackathon shortcut:</strong> this saves in your browser for now.
          Add Supabase after the demo flow is working.
        </div>
      </div>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                value={profile[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
            ) : (
              <input
                value={profile[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
            )}
          </label>
        ))}

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={handleReset}>
            <RotateCcw aria-hidden="true" />
            Reset
          </button>
          <button type="submit" className="primary-button">
            <Save aria-hidden="true" />
            Save profile
          </button>
          <button type="submit" className="primary-button">
            <ArrowRight aria-hidden="true" />
            Go to chat
          </button>
        </div>
      </form>
    </section>
  );
}
