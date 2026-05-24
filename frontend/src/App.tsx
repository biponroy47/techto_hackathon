import { NavLink, Outlet } from "react-router-dom";
import { BadgeDollarSign, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";

export default function App() {
  const { fullName, user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BadgeDollarSign aria-hidden="true" />
          <span>Finance Consultant</span>
        </div>
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/onboarding">Onboarding</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          {isSupabaseConfigured && !user && <NavLink to="/auth">Log in</NavLink>}
        </nav>
        {isSupabaseConfigured && user && (
          <div className="account-chip">
            <span>{fullName || user.email}</span>
            <button type="button" onClick={() => void signOut()} aria-label="Sign out">
              <LogOut aria-hidden="true" />
            </button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
