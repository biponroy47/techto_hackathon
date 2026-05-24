"use client";

import {
  TrendingUp,
  ShoppingCart,
  Home,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Package,
  Utensils,
} from "lucide-react";
import { BalanceCard } from "../components/dashboard/BalanceCard";
import { QuickStats } from "../components/dashboard/QuickStats";
import { BudgetGoals } from "../components/dashboard/BudgetGoals";
import { SpendingCalendar } from "../components/dashboard/SpendingCalendar";
import { SpendingBreakdown } from "../components/dashboard/SpendingBreakdown";
import { RecentTransactions } from "../components/dashboard/RecentTransactions";
import { LivingSituation } from "../components/dashboard/LivingSituation";
import { loadProfile } from "../lib/profileStorage";
import {
  parseUpcomingExpenses,
  type UpcomingExpenseItem,
} from "../lib/upcomingExpenses";

// ── Data ──────────────────────────────────────────────────────────────────────

const spendingDays: Record<number, "low" | "mid" | "high"> = {
  1: "low",
  2: "high",
  4: "mid",
  5: "low",
  7: "high",
  8: "mid",
  10: "low",
  11: "low",
  12: "high",
  14: "mid",
  15: "low",
  17: "high",
  18: "mid",
  20: "low",
  21: "high",
  23: "mid",
  24: "low",
  25: "high",
  27: "mid",
  28: "low",
};

const transactions = [
  {
    id: 1,
    label: "Rent / Mortgage",
    amount: -1400,
    icon: Home,
    category: "Housing",
    date: "May 1",
  },
  {
    id: 2,
    label: "Freelance Income",
    amount: +2800,
    icon: TrendingUp,
    category: "Income",
    date: "May 3",
  },
  {
    id: 3,
    label: "Groceries",
    amount: -87,
    icon: ShoppingCart,
    category: "Food",
    date: "May 5",
  },
  {
    id: 4,
    label: "Gym Membership",
    amount: -45,
    icon: Dumbbell,
    category: "Fitness",
    date: "May 8",
  },
  {
    id: 5,
    label: "Internet",
    amount: -60,
    icon: Wifi,
    category: "Utilities",
    date: "May 9",
  },
  {
    id: 6,
    label: "Coffee Shop",
    amount: -12,
    icon: Coffee,
    category: "Eating out",
    date: "May 11",
  },
];

const breakdown = [
  { label: "Housing", value: 1400, pct: 50, color: "#E9631A" },
  { label: "Food", value: 320, pct: 11, color: "#c4b89a" },
  { label: "Utilities", value: 180, pct: 6, color: "#a89880" },
  { label: "Fitness", value: 95, pct: 3, color: "#D9CEB8" },
  { label: "Other", value: 155, pct: 5, color: "#6b6358" },
];

const goals = [
  { label: "Monthly Budget", current: 2000, target: 3000, color: "#E9631A" },
  { label: "Emergency Fund", current: 4200, target: 6000, color: "#a89880" },
  { label: "Savings Goal", current: 8500, target: 10000, color: "#E9631A" },
];

const livingSituation = [
  { icon: Home, label: "With Partner", active: true },
  { icon: Car, label: "Transit", active: true },
  { icon: Wifi, label: "Internet", active: true },
  { icon: Package, label: "Subscriptions", active: false },
  { icon: Utensils, label: "Eating Out", active: true },
  { icon: Dumbbell, label: "Gym", active: false },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const totalBalance = 12850;
  const income = 5200;
  const expenses = 2150;
  const saved = income - expenses;
  const dailyAvg = Math.round(expenses / 30);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Calendar params derived from current date
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();
  const monthName = today.toLocaleString("en-US", { month: "long" });
  const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Build upcoming expense day map from user profile
  const profile = loadProfile();
  const upcomingItems = parseUpcomingExpenses(profile.upcomingExpenses);
  const upcomingExpenseDays: Record<number, UpcomingExpenseItem[]> = {};
  for (const item of upcomingItems) {
    if (!item.dateISO) continue;
    const d = new Date(item.dateISO + "T00:00:00");
    if (isNaN(d.getTime())) continue;
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const day = d.getDate();
      if (!upcomingExpenseDays[day]) upcomingExpenseDays[day] = [];
      upcomingExpenseDays[day].push(item);
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <p className="dash-header-date">{formattedDate}</p>
            <h1 className="dash-header-title">
              Good morning, <span style={{ color: "#E9631A" }}>Alex</span>
            </h1>
            <p className="dash-header-sub">
              Here&apos;s what&apos;s happening with your money today.
            </p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="dash-grid">
          {/* Row 1: Balance, Stats, Budget */}
          <BalanceCard
            totalBalance={totalBalance}
            income={income}
            expenses={expenses}
          />
          <QuickStats saved={saved} dailyAvg={dailyAvg} />
          <BudgetGoals goals={goals} />

          {/* Row 2: Calendar + Breakdown */}
          <SpendingCalendar
            month={monthName}
            year={currentYear}
            startWeekday={firstWeekday}
            totalDays={totalDays}
            today={currentDay}
            spendingDays={spendingDays}
            upcomingExpenseDays={upcomingExpenseDays}
          />
          <SpendingBreakdown breakdown={breakdown} />

          {/* Row 3: Transactions + Living Situation */}
          <RecentTransactions transactions={transactions} onSeeAll={() => {}} />
          <LivingSituation items={livingSituation} />
        </div>
      </div>
    </div>
  );
}
