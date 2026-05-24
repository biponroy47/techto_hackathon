import { NavLink, Outlet } from "react-router-dom";
import { BadgeDollarSign } from "lucide-react";

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BadgeDollarSign aria-hidden="true" />
          <span>Finance Consultant</span>
        </div>
        <nav>
          <NavLink to="/">Onboarding</NavLink>
          <NavLink to="/chat">Chat</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
