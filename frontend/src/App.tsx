import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BadgeDollarSign, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";

export default function App() {
  const { fullName, user, signOut } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

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
          {!isLandingPage && <NavLink to="/onboarding">Onboarding</NavLink>}
          {!isLandingPage && <NavLink to="/chat">Chat</NavLink>}
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
