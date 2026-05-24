export type FinanceProfile = {
  fullName: string;
  occupation: string;
  status: string;
  monthlyIncome: string;
  housingCost: string;
  subscriptions: string;
  recurringExpenses: string;
  debts: string;
  upcomingExpenses: string;
  savingsGoals: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
