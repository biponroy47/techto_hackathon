import type { FinanceProfile } from "../types";

export const emptyProfile: FinanceProfile = {
  fullName: "",
  occupation: "",
  status: "",
  monthlyIncome: "",
  housingCost: "",
  subscriptions: "",
  recurringExpenses: "",
  debts: "",
  upcomingExpenses: "",
  savingsGoals: "",
  netWorthItems: "",
};

const storageKey = "finance-consultant-profile";

export function loadProfile(): FinanceProfile {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return emptyProfile;
  }

  try {
    return { ...emptyProfile, ...JSON.parse(saved) };
  } catch {
    return emptyProfile;
  }
}

export function saveProfile(profile: FinanceProfile) {
  localStorage.setItem(storageKey, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(storageKey);
}
