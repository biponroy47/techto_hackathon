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
  netWorthItems: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
