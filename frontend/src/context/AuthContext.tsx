import { ReactNode, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { AuthContext, type AuthContextValue } from "./authContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const fullName =
      typeof user?.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";

    return {
      isLoading,
      session,
      user,
      fullName,
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut({ scope: "local" });
        }
      }
    };
  }, [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
