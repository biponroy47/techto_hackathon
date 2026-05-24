import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

type AuthMode = "signup" | "login";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!data.session) {
          setMessage("Account created. Check your email to confirm it, then log in.");
          return;
        }

        navigate("/onboarding");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      navigate("/onboarding");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (user) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <section className="auth-page">
      <div className="intro-panel">
        <p className="eyebrow">Account</p>
        <h1>{mode === "signup" ? "Create your FiHo profile." : "Welcome back to FiHo."}</h1>
        <p>
          Your profile helps FiHo personalize guidance for budgets, cash flow,
          debts, savings, and the goals you want to reach.
        </p>
        <div className="tip-box">
          Start with the basics. You can refine your profile as your financial horizon changes.
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
        </div>

        {mode === "signup" && (
          <label className="field">
            <span>Name</span>
            <input
              value={fullName}
              placeholder="Bipon Roy"
              required
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            placeholder="At least 6 characters"
            required
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button type="submit" className="primary-button" disabled={isLoading}>
          {mode === "signup" ? <UserPlus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          {isLoading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
        </button>

        {!supabase && (
          <Link to="/onboarding" className="text-link">
            Continue locally
          </Link>
        )}
      </form>
    </section>
  );
}
