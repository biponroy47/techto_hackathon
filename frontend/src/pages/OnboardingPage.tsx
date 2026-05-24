import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, Save } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { loadUserProfile, saveUserProfile } from "../lib/profileRepository";
import { clearProfile, emptyProfile } from "../lib/profileStorage";
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
    placeholder: "Trip $1200 in 4 months\nCar insurance $480 due Mar 15\nLaptop repair $350 this month",
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
  const { user, fullName } = useAuth();
  const [profile, setProfile] = useState<FinanceProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadUserProfile(user?.id)
      .then((savedProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile({
          ...savedProfile,
          fullName: savedProfile.fullName || fullName
        });
      })
      .catch(() => {
        if (isMounted) {
          setError("Could not load your saved onboarding profile.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fullName, user?.id]);

  function updateField(name: keyof FinanceProfile, value: string) {
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await saveUserProfile(user?.id, profile);
      navigate("/chat");
    } catch {
      setError("Could not save your profile. Check your Supabase setup and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    clearProfile();
    setError("");
    setProfile({ ...emptyProfile, fullName: fullName || profile.fullName });
  }

  return (
    <section className="page-grid">
      <div className="intro-panel">
        <p className="eyebrow">Step 1</p>
        <h1>
          {profile.fullName
            ? `Hi ${profile.fullName}, tell us your financial picture.`
            : "Tell the app your financial picture."}
        </h1>
        <p>
          Add enough detail for the consultant to understand your income,
          recurring costs, goals, and pressure points.
        </p>
        <div className="tip-box">
          <strong>Account profile:</strong> your onboarding answers are tied to
          your login when Supabase is configured.
        </div>
      </div>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        {isLoading && <p className="status-message">Loading your profile...</p>}
        {error && <p className="error-message">{error}</p>}

        <label className="field">
          <span>Name</span>
          <input
            value={profile.fullName}
            placeholder="Bipon Roy"
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>

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
          <button type="submit" className="primary-button" disabled={isSaving || isLoading}>
            <Save aria-hidden="true" />
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          <button type="submit" className="primary-button" disabled={isSaving || isLoading}>
            <ArrowRight aria-hidden="true" />
            Go to chat
          </button>
        </div>
      </form>
    </section>
  );
}
