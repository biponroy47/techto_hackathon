import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { loadUserProfile, saveUserProfile } from "../lib/profileRepository";
import { clearProfile, emptyProfile } from "../lib/profileStorage";
import type { FinanceProfile } from "../types";

type BillingCycle = "monthly" | "annual";

type RecurringItem = {
  id: string;
  name: string;
  cost: string;
  basis: BillingCycle;
  recurringDate: string;
};

type DebtItem = {
  id: string;
  name: string;
  amount: string;
  type: string;
  interestRate: string;
};

type UpcomingExpenseItem = {
  id: string;
  name: string;
  cost: string;
  date: string;
  type: string;
};

type SavingsGoalItem = {
  id: string;
  name: string;
  amount: string;
  type: string;
  target: string;
};

type ValidationErrors = Partial<Record<keyof FinanceProfile | "form", string>>;

type ListField =
  | "subscriptions"
  | "recurringExpenses"
  | "debts"
  | "upcomingExpenses"
  | "savingsGoals";

const occupationOptions = [
  "Student",
  "Software / Technology",
  "Healthcare",
  "Education",
  "Retail / Service",
  "Finance / Business",
  "Trades / Construction",
  "Freelancer / Self-employed",
  "Unemployed",
  "Other",
];

const statusOptions = [
  "Student",
  "Working full-time",
  "Working part-time",
  "Self-employed",
  "Between jobs",
  "Recent graduate",
  "Supporting family",
  "Planning a major purchase",
  "Paying down debt",
  "Other",
];

const debtTypes = [
  "Credit card",
  "Student loan",
  "Car loan",
  "Line of credit",
  "Personal loan",
  "Mortgage",
  "Other",
];
const expenseTypes = [
  "Travel",
  "School",
  "Medical",
  "Moving",
  "Vehicle",
  "Gift",
  "Emergency",
  "Other",
];
const savingsGoalTypes = [
  "Emergency fund",
  "Travel",
  "Education",
  "Home",
  "Vehicle",
  "Investing",
  "Retirement",
  "Other",
];
const billingCycleOptions: BillingCycle[] = ["monthly", "annual"];
const currencyPattern = /^\d+(\.\d{1,2})?$/;
const percentPattern = /^\d+(\.\d{1,2})?$/;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newRecurringItem(): RecurringItem {
  return {
    id: createId(),
    name: "",
    cost: "",
    basis: "monthly",
    recurringDate: "",
  };
}

function newDebtItem(): DebtItem {
  return {
    id: createId(),
    name: "",
    amount: "",
    type: "Credit card",
    interestRate: "",
  };
}

function newUpcomingExpenseItem(): UpcomingExpenseItem {
  return { id: createId(), name: "", cost: "", date: "", type: "Travel" };
}

function newSavingsGoalItem(): SavingsGoalItem {
  return {
    id: createId(),
    name: "",
    amount: "",
    type: "Emergency fund",
    target: "",
  };
}

function safeParseList<T>(value: string, fallback: T[]): T[] {
  if (!value.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function serializeList(items: unknown[]) {
  if (items.length === 0) {
    return "";
  }

  return JSON.stringify(items);
}

function isBlankRecurringItem(item: RecurringItem) {
  return !item.name.trim() && !item.cost.trim() && !item.recurringDate.trim();
}

function isBlankDebtItem(item: DebtItem) {
  return !item.name.trim() && !item.amount.trim() && !item.interestRate.trim();
}

function isBlankUpcomingExpenseItem(item: UpcomingExpenseItem) {
  return !item.name.trim() && !item.cost.trim() && !item.date.trim();
}

function isBlankSavingsGoalItem(item: SavingsGoalItem) {
  return !item.name.trim() && !item.amount.trim() && !item.target.trim();
}

function validateCurrency(value: string) {
  return value.trim().length > 0 && currencyPattern.test(value.trim());
}

function validateRecurringList(items: RecurringItem[]) {
  return items.every(
    (item) =>
      isBlankRecurringItem(item) ||
      (item.name.trim() &&
        validateCurrency(item.cost) &&
        item.recurringDate.trim()),
  );
}

function validateDebtList(items: DebtItem[]) {
  return items.every(
    (item) =>
      isBlankDebtItem(item) ||
      (item.name.trim() &&
        validateCurrency(item.amount) &&
        (!item.interestRate || percentPattern.test(item.interestRate))),
  );
}

function validateUpcomingList(items: UpcomingExpenseItem[]) {
  return items.every(
    (item) =>
      isBlankUpcomingExpenseItem(item) ||
      (item.name.trim() && validateCurrency(item.cost) && item.date.trim()),
  );
}

function validateSavingsList(items: SavingsGoalItem[]) {
  return items.every(
    (item) =>
      isBlankSavingsGoalItem(item) ||
      (item.name.trim() && validateCurrency(item.amount)),
  );
}

function pruneRecurring(items: RecurringItem[]) {
  return items.filter((item) => !isBlankRecurringItem(item));
}

function pruneDebts(items: DebtItem[]) {
  return items.filter((item) => !isBlankDebtItem(item));
}

function pruneUpcoming(items: UpcomingExpenseItem[]) {
  return items.filter((item) => !isBlankUpcomingExpenseItem(item));
}

function pruneSavings(items: SavingsGoalItem[]) {
  return items.filter((item) => !isBlankSavingsGoalItem(item));
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, fullName } = useAuth();
  const [profile, setProfile] = useState<FinanceProfile>(emptyProfile);
  const [subscriptions, setSubscriptions] = useState<RecurringItem[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringItem[]>(
    [],
  );
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState<
    UpcomingExpenseItem[]
  >([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  useEffect(() => {
    let isMounted = true;

    loadUserProfile(user?.id)
      .then((savedProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile({
          ...savedProfile,
          fullName: savedProfile.fullName || fullName,
        });
        setSubscriptions(
          safeParseList<RecurringItem>(savedProfile.subscriptions, []),
        );
        setRecurringExpenses(
          safeParseList<RecurringItem>(savedProfile.recurringExpenses, []),
        );
        setDebts(safeParseList<DebtItem>(savedProfile.debts, []));
        setUpcomingExpenses(
          safeParseList<UpcomingExpenseItem>(savedProfile.upcomingExpenses, []),
        );
        setSavingsGoals(
          safeParseList<SavingsGoalItem>(savedProfile.savingsGoals, []),
        );
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your saved profile.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fullName, user?.id]);

  const monthlyCommitments = useMemo(() => {
    const subscriptionTotal = subscriptions.reduce(
      (total, item) => total + normalizedMonthlyCost(item),
      0,
    );
    const expenseTotal = recurringExpenses.reduce(
      (total, item) => total + normalizedMonthlyCost(item),
      0,
    );
    return subscriptionTotal + expenseTotal;
  }, [recurringExpenses, subscriptions]);

  function updateField(name: keyof FinanceProfile, value: string) {
    setProfile((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: undefined }));
  }

  function buildProfileForSave() {
    return {
      ...profile,
      subscriptions: serializeList(pruneRecurring(subscriptions)),
      recurringExpenses: serializeList(pruneRecurring(recurringExpenses)),
      debts: serializeList(pruneDebts(debts)),
      upcomingExpenses: serializeList(pruneUpcoming(upcomingExpenses)),
      savingsGoals: serializeList(pruneSavings(savingsGoals)),
    };
  }

  function validateProfile() {
    const nextErrors: ValidationErrors = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = "Add your name.";
    }

    if (!profile.occupation.trim()) {
      nextErrors.occupation = "Choose an occupation.";
    }

    if (!profile.status.trim()) {
      nextErrors.status = "Choose your current situation.";
    }

    if (!validateCurrency(profile.monthlyIncome)) {
      nextErrors.monthlyIncome =
        "Enter a valid dollar amount, like 2400 or 2400.50.";
    }

    if (!validateCurrency(profile.housingCost)) {
      nextErrors.housingCost =
        "Enter a valid dollar amount, like 950 or 950.50.";
    }

    if (!validateRecurringList(subscriptions)) {
      nextErrors.subscriptions =
        "Each subscription needs a name, valid cost, and recurring date.";
    }

    if (!validateRecurringList(recurringExpenses)) {
      nextErrors.recurringExpenses =
        "Each recurring expense needs a name, valid cost, and recurring date.";
    }

    if (!validateDebtList(debts)) {
      nextErrors.debts =
        "Each debt needs a name and valid amount. Interest rate must be a number if included.";
    }

    if (!validateUpcomingList(upcomingExpenses)) {
      nextErrors.upcomingExpenses =
        "Each upcoming expense needs a name, valid cost, and date.";
    }

    if (!validateSavingsList(savingsGoals)) {
      nextErrors.savingsGoals =
        "Each savings goal needs a name and valid amount.";
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!validateProfile()) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }

    setIsSaving(true);

    try {
      const saveResult = await saveUserProfile(user?.id, buildProfileForSave());

      if (saveResult.mode === "local") {
        console.warn(
          "Supabase profile save was blocked by row-level security. Saved locally instead.",
        );
      }

      navigate("/chat");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile. Check your Supabase setup and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    clearProfile();
    setError("");
    setValidationErrors({});
    setProfile({ ...emptyProfile, fullName: fullName || profile.fullName });
    setSubscriptions([]);
    setRecurringExpenses([]);
    setDebts([]);
    setUpcomingExpenses([]);
    setSavingsGoals([]);
  }

  return (
    <section className="page-grid">
      <div className="intro-panel">
        <p className="eyebrow">Step 1</p>
        <h1>
          {profile.fullName
            ? `Hi ${profile.fullName}, tell us your financial picture.`
            : "Tell FiHo your financial picture."}
        </h1>
        <p>
          Add structured details so FiHo can reason about your income, monthly
          costs, debts, goals, and upcoming expenses.
        </p>
        <div className="tip-box">
          <strong>Estimated recurring commitments:</strong>{" "}
          {formatCurrency(monthlyCommitments)} per month.
        </div>
      </div>

      <form className="onboarding-form" noValidate onSubmit={handleSubmit}>
        {isLoading && <p className="status-message">Loading your profile...</p>}
        {error && <p className="error-message">{error}</p>}

        <label className="field">
          <span>Name</span>
          <input
            className={validationErrors.fullName ? "field-control-error" : ""}
            aria-invalid={Boolean(validationErrors.fullName)}
            value={profile.fullName}
            placeholder="Bipon Roy"
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          <FieldError message={validationErrors.fullName} />
        </label>

        <label className="field">
          <span>Occupation</span>
          <select
            className={validationErrors.occupation ? "field-control-error" : ""}
            aria-invalid={Boolean(validationErrors.occupation)}
            value={profile.occupation}
            onChange={(event) => updateField("occupation", event.target.value)}
          >
            <option value="">Select occupation</option>
            {occupationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={validationErrors.occupation} />
        </label>

        <label className="field">
          <span>Current situation</span>
          <select
            className={validationErrors.status ? "field-control-error" : ""}
            aria-invalid={Boolean(validationErrors.status)}
            value={profile.status}
            onChange={(event) => updateField("status", event.target.value)}
          >
            <option value="">Select current situation</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={validationErrors.status} />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Monthly income</span>
            <div
              className={`money-input ${validationErrors.monthlyIncome ? "field-control-error" : ""}`}
            >
              <span>$</span>
              <input
                aria-invalid={Boolean(validationErrors.monthlyIncome)}
                inputMode="decimal"
                value={profile.monthlyIncome}
                placeholder="2400.00"
                onChange={(event) =>
                  updateField(
                    "monthlyIncome",
                    cleanMoneyInput(event.target.value),
                  )
                }
              />
            </div>
            <FieldError message={validationErrors.monthlyIncome} />
          </label>

          <label className="field">
            <span>Rent or housing cost</span>
            <div
              className={`money-input ${validationErrors.housingCost ? "field-control-error" : ""}`}
            >
              <span>$</span>
              <input
                aria-invalid={Boolean(validationErrors.housingCost)}
                inputMode="decimal"
                value={profile.housingCost}
                placeholder="950.00"
                onChange={(event) =>
                  updateField(
                    "housingCost",
                    cleanMoneyInput(event.target.value),
                  )
                }
              />
            </div>
            <FieldError message={validationErrors.housingCost} />
          </label>
        </div>

        <RecurringListEditor
          title="Subscriptions"
          description="Streaming, apps, memberships, software, gyms, and other repeating subscriptions."
          items={subscriptions}
          error={validationErrors.subscriptions}
          onAdd={() =>
            setSubscriptions((current) => [...current, newRecurringItem()])
          }
          onRemove={(id) =>
            setSubscriptions((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onChange={(id, patch) => {
            setSubscriptions((current) => updateById(current, id, patch));
            clearListError("subscriptions");
          }}
        />

        <RecurringListEditor
          title="Recurring expenses"
          description="Bills and predictable expenses such as phone, insurance, transit, groceries, and utilities."
          items={recurringExpenses}
          error={validationErrors.recurringExpenses}
          onAdd={() =>
            setRecurringExpenses((current) => [...current, newRecurringItem()])
          }
          onRemove={(id) =>
            setRecurringExpenses((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onChange={(id, patch) => {
            setRecurringExpenses((current) => updateById(current, id, patch));
            clearListError("recurringExpenses");
          }}
        />

        <DebtListEditor
          items={debts}
          error={validationErrors.debts}
          onAdd={() => setDebts((current) => [...current, newDebtItem()])}
          onRemove={(id) =>
            setDebts((current) => current.filter((item) => item.id !== id))
          }
          onChange={(id, patch) => {
            setDebts((current) => updateById(current, id, patch));
            clearListError("debts");
          }}
        />

        <UpcomingExpensesEditor
          items={upcomingExpenses}
          error={validationErrors.upcomingExpenses}
          onAdd={() =>
            setUpcomingExpenses((current) => [
              ...current,
              newUpcomingExpenseItem(),
            ])
          }
          onRemove={(id) =>
            setUpcomingExpenses((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onChange={(id, patch) => {
            setUpcomingExpenses((current) => updateById(current, id, patch));
            clearListError("upcomingExpenses");
          }}
        />

        <SavingsGoalsEditor
          items={savingsGoals}
          error={validationErrors.savingsGoals}
          onAdd={() =>
            setSavingsGoals((current) => [...current, newSavingsGoalItem()])
          }
          onRemove={(id) =>
            setSavingsGoals((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onChange={(id, patch) => {
            setSavingsGoals((current) => updateById(current, id, patch));
            clearListError("savingsGoals");
          }}
        />

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
          >
            <RotateCcw aria-hidden="true" />
            Reset
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || isLoading}
          >
            <Save aria-hidden="true" />
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || isLoading}
          >
            <ArrowRight aria-hidden="true" />
            Go to Dashboard
          </button>
        </div>
      </form>
    </section>
  );

  function clearListError(field: ListField) {
    setValidationErrors((current) => ({ ...current, [field]: undefined }));
  }
}

function RecurringListEditor({
  title,
  description,
  items,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  description: string;
  items: RecurringItem[];
  error?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<RecurringItem>) => void;
}) {
  return (
    <section className={`list-editor ${error ? "list-editor-error" : ""}`}>
      <ListHeader title={title} description={description} onAdd={onAdd} />
      {items.length === 0 && <p className="empty-list">No items added yet.</p>}
      {items.map((item) => {
        const itemHasError =
          Boolean(error) &&
          !isBlankRecurringItem(item) &&
          !(
            item.name.trim() &&
            validateCurrency(item.cost) &&
            item.recurringDate.trim()
          );

        return (
          <div
            key={item.id}
            className={`list-item-grid recurring-grid ${itemHasError ? "list-item-error" : ""}`}
          >
            <label className="field compact-field">
              <span>Name</span>
              <input
                className={
                  itemHasError && !item.name.trim() ? "field-control-error" : ""
                }
                aria-invalid={itemHasError && !item.name.trim()}
                value={item.name}
                placeholder="Netflix"
                onChange={(event) =>
                  onChange(item.id, { name: event.target.value })
                }
              />
            </label>
            <label className="field compact-field">
              <span>Cost</span>
              <div
                className={`money-input ${itemHasError && !validateCurrency(item.cost) ? "field-control-error" : ""}`}
              >
                <span>$</span>
                <input
                  aria-invalid={itemHasError && !validateCurrency(item.cost)}
                  inputMode="decimal"
                  value={item.cost}
                  placeholder="18.99"
                  onChange={(event) =>
                    onChange(item.id, {
                      cost: cleanMoneyInput(event.target.value),
                    })
                  }
                />
              </div>
            </label>
            <label className="field compact-field">
              <span>Basis</span>
              <select
                value={item.basis}
                onChange={(event) =>
                  onChange(item.id, {
                    basis: event.target.value as BillingCycle,
                  })
                }
              >
                {billingCycleOptions.map((option) => (
                  <option key={option} value={option}>
                    {capitalize(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field compact-field">
              <span>Recurring date</span>
              <input
                className={
                  itemHasError && !item.recurringDate.trim()
                    ? "field-control-error"
                    : ""
                }
                aria-invalid={itemHasError && !item.recurringDate.trim()}
                type="date"
                value={item.recurringDate}
                onChange={(event) =>
                  onChange(item.id, { recurringDate: event.target.value })
                }
              />
            </label>
            <RemoveButton onClick={() => onRemove(item.id)} />
          </div>
        );
      })}
      <FieldError message={error} />
    </section>
  );
}

function DebtListEditor({
  items,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  items: DebtItem[];
  error?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<DebtItem>) => void;
}) {
  return (
    <section className={`list-editor ${error ? "list-editor-error" : ""}`}>
      <ListHeader
        title="Debts"
        description="Loans, credit cards, and balances you are paying down."
        onAdd={onAdd}
      />
      {items.length === 0 && <p className="empty-list">No debts added yet.</p>}
      {items.map((item) => {
        const itemHasError =
          Boolean(error) &&
          !isBlankDebtItem(item) &&
          !(
            item.name.trim() &&
            validateCurrency(item.amount) &&
            (!item.interestRate || percentPattern.test(item.interestRate))
          );

        return (
          <div
            key={item.id}
            className={`list-item-grid debt-grid ${itemHasError ? "list-item-error" : ""}`}
          >
            <label className="field compact-field">
              <span>Name</span>
              <input
                className={
                  itemHasError && !item.name.trim() ? "field-control-error" : ""
                }
                aria-invalid={itemHasError && !item.name.trim()}
                value={item.name}
                placeholder="Visa card"
                onChange={(event) =>
                  onChange(item.id, { name: event.target.value })
                }
              />
            </label>
            <label className="field compact-field">
              <span>Debt amount</span>
              <div
                className={`money-input ${itemHasError && !validateCurrency(item.amount) ? "field-control-error" : ""}`}
              >
                <span>$</span>
                <input
                  aria-invalid={itemHasError && !validateCurrency(item.amount)}
                  inputMode="decimal"
                  value={item.amount}
                  placeholder="1200.00"
                  onChange={(event) =>
                    onChange(item.id, {
                      amount: cleanMoneyInput(event.target.value),
                    })
                  }
                />
              </div>
            </label>
            <label className="field compact-field">
              <span>Type</span>
              <select
                value={item.type}
                onChange={(event) =>
                  onChange(item.id, { type: event.target.value })
                }
              >
                {debtTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field compact-field">
              <span>Interest rate</span>
              <div
                className={`money-input percent-input ${itemHasError && item.interestRate && !percentPattern.test(item.interestRate) ? "field-control-error" : ""}`}
              >
                <input
                  aria-invalid={
                    itemHasError &&
                    Boolean(item.interestRate) &&
                    !percentPattern.test(item.interestRate)
                  }
                  inputMode="decimal"
                  value={item.interestRate}
                  placeholder="19.99"
                  onChange={(event) =>
                    onChange(item.id, {
                      interestRate: cleanMoneyInput(event.target.value),
                    })
                  }
                />
                <span>%</span>
              </div>
            </label>
            <RemoveButton onClick={() => onRemove(item.id)} />
          </div>
        );
      })}
      <FieldError message={error} />
    </section>
  );
}

function UpcomingExpensesEditor({
  items,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  items: UpcomingExpenseItem[];
  error?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<UpcomingExpenseItem>) => void;
}) {
  return (
    <section className={`list-editor ${error ? "list-editor-error" : ""}`}>
      <ListHeader
        title="Upcoming expenses"
        description="Future costs FiHo should plan around."
        onAdd={onAdd}
      />
      {items.length === 0 && (
        <p className="empty-list">No upcoming expenses added yet.</p>
      )}
      {items.map((item) => {
        const itemHasError =
          Boolean(error) &&
          !isBlankUpcomingExpenseItem(item) &&
          !(
            item.name.trim() &&
            validateCurrency(item.cost) &&
            item.date.trim()
          );

        return (
          <div
            key={item.id}
            className={`list-item-grid upcoming-grid ${itemHasError ? "list-item-error" : ""}`}
          >
            <label className="field compact-field">
              <span>Name</span>
              <input
                className={
                  itemHasError && !item.name.trim() ? "field-control-error" : ""
                }
                aria-invalid={itemHasError && !item.name.trim()}
                value={item.name}
                placeholder="Summer trip"
                onChange={(event) =>
                  onChange(item.id, { name: event.target.value })
                }
              />
            </label>
            <label className="field compact-field">
              <span>Cost</span>
              <div
                className={`money-input ${itemHasError && !validateCurrency(item.cost) ? "field-control-error" : ""}`}
              >
                <span>$</span>
                <input
                  aria-invalid={itemHasError && !validateCurrency(item.cost)}
                  inputMode="decimal"
                  value={item.cost}
                  placeholder="1200.00"
                  onChange={(event) =>
                    onChange(item.id, {
                      cost: cleanMoneyInput(event.target.value),
                    })
                  }
                />
              </div>
            </label>
            <label className="field compact-field">
              <span>Date</span>
              <input
                className={
                  itemHasError && !item.date.trim() ? "field-control-error" : ""
                }
                aria-invalid={itemHasError && !item.date.trim()}
                type="date"
                value={item.date}
                onChange={(event) =>
                  onChange(item.id, { date: event.target.value })
                }
              />
            </label>
            <label className="field compact-field">
              <span>Type</span>
              <select
                value={item.type}
                onChange={(event) =>
                  onChange(item.id, { type: event.target.value })
                }
              >
                {expenseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <RemoveButton onClick={() => onRemove(item.id)} />
          </div>
        );
      })}
      <FieldError message={error} />
    </section>
  );
}

function SavingsGoalsEditor({
  items,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  items: SavingsGoalItem[];
  error?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<SavingsGoalItem>) => void;
}) {
  return (
    <section className={`list-editor ${error ? "list-editor-error" : ""}`}>
      <ListHeader
        title="Savings goals"
        description="Goals with target amounts and optional timing."
        onAdd={onAdd}
      />
      {items.length === 0 && (
        <p className="empty-list">No savings goals added yet.</p>
      )}
      {items.map((item) => {
        const itemHasError =
          Boolean(error) &&
          !isBlankSavingsGoalItem(item) &&
          !(item.name.trim() && validateCurrency(item.amount));

        return (
          <div
            key={item.id}
            className={`list-item-grid savings-grid ${itemHasError ? "list-item-error" : ""}`}
          >
            <label className="field compact-field">
              <span>Name</span>
              <input
                className={
                  itemHasError && !item.name.trim() ? "field-control-error" : ""
                }
                aria-invalid={itemHasError && !item.name.trim()}
                value={item.name}
                placeholder="Emergency fund"
                onChange={(event) =>
                  onChange(item.id, { name: event.target.value })
                }
              />
            </label>
            <label className="field compact-field">
              <span>Amount</span>
              <div
                className={`money-input ${itemHasError && !validateCurrency(item.amount) ? "field-control-error" : ""}`}
              >
                <span>$</span>
                <input
                  aria-invalid={itemHasError && !validateCurrency(item.amount)}
                  inputMode="decimal"
                  value={item.amount}
                  placeholder="5000.00"
                  onChange={(event) =>
                    onChange(item.id, {
                      amount: cleanMoneyInput(event.target.value),
                    })
                  }
                />
              </div>
            </label>
            <label className="field compact-field">
              <span>Type</span>
              <select
                value={item.type}
                onChange={(event) =>
                  onChange(item.id, { type: event.target.value })
                }
              >
                {savingsGoalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field compact-field">
              <span>Target date, age, or year</span>
              <input
                value={item.target}
                placeholder="2027, age 30, or Dec 2026"
                onChange={(event) =>
                  onChange(item.id, { target: event.target.value })
                }
              />
            </label>
            <RemoveButton onClick={() => onRemove(item.id)} />
          </div>
        );
      })}
      <FieldError message={error} />
    </section>
  );
}

function ListHeader({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;
  onAdd: () => void;
}) {
  return (
    <div className="list-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className="secondary-button icon-button"
        onClick={onAdd}
        aria-label={`Add ${title}`}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="remove-button"
      onClick={onClick}
      aria-label="Remove item"
    >
      <Trash2 aria-hidden="true" />
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span className="field-error">Warning: {message}</span>;
}

function updateById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>,
) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function cleanMoneyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...decimalParts] = cleaned.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
}

function normalizedMonthlyCost(item: RecurringItem) {
  const cost = Number(item.cost);

  if (!Number.isFinite(cost)) {
    return 0;
  }

  return item.basis === "annual" ? cost / 12 : cost;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
