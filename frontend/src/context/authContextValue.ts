import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  fullName: string;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
