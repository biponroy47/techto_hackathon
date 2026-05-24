import { Link, NavLink, Outlet } from "react-router-dom";
import { BadgeDollarSign, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";

export default function App() {
  const { fullName, user, signOut } = useAuth();
  const showProductLinks = Boolean(user);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="FiHo home">
          <BadgeDollarSign aria-hidden="true" />
          <span>FiHo</span>
        </Link>
        <nav>
          {showProductLinks && <NavLink to="/onboarding">Onboarding</NavLink>}
          {showProductLinks && <NavLink to="/chat">Chat</NavLink>}
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
