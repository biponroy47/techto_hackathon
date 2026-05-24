import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function ProtectedRoute() {
  const { isLoading, user } = useAuth();

  if (!isSupabaseConfigured) {
    return <Outlet />;
  }

  if (isLoading) {
    return <div className="centered-page">Loading your account...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
