import { emptyProfile, loadProfile, saveProfile } from "./profileStorage";
import { supabase } from "./supabaseClient";
import type { FinanceProfile } from "../types";

function isRowLevelSecurityError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42501" ||
    /row-level security|permission denied/i.test(error.message ?? "")
  );
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  occupation: string | null;
  status: string | null;
  monthly_income: string | null;
  housing_cost: string | null;
  subscriptions: string | null;
  recurring_expenses: string | null;
  debts: string | null;
  upcoming_expenses: string | null;
  savings_goals: string | null;
};

function rowToProfile(row: ProfileRow | null): FinanceProfile {
  if (!row) {
    return emptyProfile;
  }

  return {
    fullName: row.full_name ?? "",
    occupation: row.occupation ?? "",
    status: row.status ?? "",
    monthlyIncome: row.monthly_income ?? "",
    housingCost: row.housing_cost ?? "",
    subscriptions: row.subscriptions ?? "",
    recurringExpenses: row.recurring_expenses ?? "",
    debts: row.debts ?? "",
    upcomingExpenses: row.upcoming_expenses ?? "",
    savingsGoals: row.savings_goals ?? "",
  };
}

function profileToRow(userId: string, profile: FinanceProfile): ProfileRow {
  return {
    id: userId,
    full_name: profile.fullName,
    occupation: profile.occupation,
    status: profile.status,
    monthly_income: profile.monthlyIncome,
    housing_cost: profile.housingCost,
    subscriptions: profile.subscriptions,
    recurring_expenses: profile.recurringExpenses,
    debts: profile.debts,
    upcoming_expenses: profile.upcomingExpenses,
    savings_goals: profile.savingsGoals,
  };
}

export async function loadUserProfile(
  userId?: string,
): Promise<FinanceProfile> {
  if (!supabase || !userId) {
    return loadProfile();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isRowLevelSecurityError(error)) {
      return loadProfile();
    }

    throw new Error(`Could not load profile: ${error.message}`);
  }

  if (!data) {
    return loadProfile();
  }

  return rowToProfile(data);
}

export async function saveUserProfile(
  userId: string | undefined,
  profile: FinanceProfile,
) {
  if (!supabase || !userId) {
    saveProfile(profile);
    return { mode: "local" as const };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(profileToRow(userId, profile), { onConflict: "id" });

  if (error) {
    if (isRowLevelSecurityError(error)) {
      saveProfile(profile);
      return { mode: "local" as const };
    }

    throw new Error(`Could not save profile: ${error.message}`);
  }

  return { mode: "supabase" as const };
}
