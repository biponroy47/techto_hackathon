import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Pencil,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Trash2,
} from "lucide-react";
import AddNetWorthItemModal, {
  type NetWorthItem,
} from "../components/AddNetWorthItemModal";
import AddSavingsGoalModal from "../components/AddSavingsGoalModal";
import AddUpcomingExpenseModal from "../components/AddUpcomingExpenseModal";
import ChatMessageContent from "../components/ChatMessageContent";
import SavingsGoalsPanel from "../components/SavingsGoalsPanel";
import UpcomingExpensesPanel from "../components/UpcomingExpensesPanel";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_SUGGESTION_PROMPTS,
  fetchChatSuggestions,
  sendChatMessage,
} from "../lib/chatApi";
import { loadUserProfile, saveUserProfile } from "../lib/profileRepository";
import { emptyProfile } from "../lib/profileStorage";
import {
  appendSavingsGoal,
  replaceProfileLine as replaceSavingsGoalLine,
} from "../lib/savingsGoals";
import {
  appendUpcomingExpense,
  parseUpcomingExpenses,
  replaceProfileLine as replaceUpcomingLine,
} from "../lib/upcomingExpenses";
import type { ChatMessage, FinanceProfile } from "../types";

const initialAssistantMessage =
  "I can help you turn your profile into a practical budget or savings plan. What would you like to plan first?";

export default function ChatPage() {
  const { user, fullName } = useAuth();
  const [profile, setProfile] = useState<FinanceProfile>(emptyProfile);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState(
    DEFAULT_SUGGESTION_PROMPTS,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddUpcomingOpen, setIsAddUpcomingOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingUpcomingLine, setEditingUpcomingLine] = useState<string | null>(
    null,
  );
  const [editingGoalLine, setEditingGoalLine] = useState<string | null>(null);
  const [isSavingUpcoming, setIsSavingUpcoming] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [netWorthItems, setNetWorthItems] = useState<NetWorthItem[]>([]);
  const [isAddNetWorthOpen, setIsAddNetWorthOpen] = useState(false);
  const [editingNetWorthItem, setEditingNetWorthItem] =
    useState<NetWorthItem | null>(null);
  const [isSavingNetWorth, setIsSavingNetWorth] = useState(false);
  const suggestionsRequestId = useRef(0);

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

        try {
          setNetWorthItems(
            savedProfile.netWorthItems
              ? (JSON.parse(savedProfile.netWorthItems) as NetWorthItem[])
              : [],
          );
        } catch {
          setNetWorthItems([]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Could not load your saved profile.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fullName, user?.id]);

  const refreshSuggestions = useCallback(
    async (conversation: ChatMessage[]) => {
      const requestId = ++suggestionsRequestId.current;
      setIsSuggestionsLoading(true);

      try {
        const suggestions = await fetchChatSuggestions(conversation, profile);

        if (requestId !== suggestionsRequestId.current) {
          return;
        }

        setSuggestedPrompts(suggestions);
      } catch {
        if (requestId === suggestionsRequestId.current) {
          setSuggestedPrompts(DEFAULT_SUGGESTION_PROMPTS);
        }
      } finally {
        if (requestId === suggestionsRequestId.current) {
          setIsSuggestionsLoading(false);
        }
      }
    },
    [profile],
  );

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }

    void refreshSuggestions(messages);
  }, [isProfileLoading, messages, refreshSuggestions]);

  const upcomingItems = useMemo(
    () => parseUpcomingExpenses(profile.upcomingExpenses),
    [profile.upcomingExpenses],
  );

  const totalNetWorth = useMemo(
    () =>
      netWorthItems.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
      ),
    [netWorthItems],
  );

  const monthlySummary = useMemo(() => {
    const income = parseFloat(profile.monthlyIncome) || 0;
    const housing = parseFloat(profile.housingCost) || 0;

    let subsTotal = 0;
    try {
      const subs = JSON.parse(profile.subscriptions || "[]") as Array<{
        cost?: string;
        basis?: string;
      }>;
      for (const s of subs) {
        const cost = parseFloat(s.cost ?? "0") || 0;
        subsTotal += s.basis === "annual" ? cost / 12 : cost;
      }
    } catch {
      /* ignore */
    }

    let recurringTotal = 0;
    try {
      const rec = JSON.parse(profile.recurringExpenses || "[]") as Array<{
        cost?: string;
        basis?: string;
      }>;
      for (const r of rec) {
        const cost = parseFloat(r.cost ?? "0") || 0;
        recurringTotal += r.basis === "annual" ? cost / 12 : cost;
      }
    } catch {
      /* ignore */
    }

    const expenses = housing + subsTotal + recurringTotal;
    return { income, expenses, remaining: income - expenses };
  }, [
    profile.monthlyIncome,
    profile.housingCost,
    profile.subscriptions,
    profile.recurringExpenses,
  ]);

  async function sendMessage(message: string) {
    if (!message.trim() || isLoading) {
      return;
    }

    setError("");
    setInput("");

    const previousMessages = messages;
    const nextMessages: ChatMessage[] = [
      ...previousMessages,
      { role: "user", content: message.trim() },
    ];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(nextMessages, profile);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages(previousMessages);
      setError(
        "Could not reach the backend. Make sure npm run dev is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function closeNetWorthModal() {
    setIsAddNetWorthOpen(false);
    setEditingNetWorthItem(null);
  }

  async function handleSaveNetWorthItem(item: Omit<NetWorthItem, "id">) {
    const id =
      editingNetWorthItem?.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const nextItems = editingNetWorthItem
      ? netWorthItems.map((nw) => (nw.id === id ? { ...nw, ...item } : nw))
      : [...netWorthItems, { id, ...item }];
    const previousProfile = profile;
    const previousItems = netWorthItems;
    const nextProfile: FinanceProfile = {
      ...profile,
      netWorthItems: JSON.stringify(nextItems),
    };
    setNetWorthItems(nextItems);
    try {
      await persistProfile(nextProfile, previousProfile, setIsSavingNetWorth);
    } catch {
      setNetWorthItems(previousItems);
      throw new Error("save failed");
    }
    closeNetWorthModal();
  }

  async function handleDeleteNetWorthItem(id: string) {
    const nextItems = netWorthItems.filter((nw) => nw.id !== id);
    const previousProfile = profile;
    const previousItems = netWorthItems;
    const nextProfile: FinanceProfile = {
      ...profile,
      netWorthItems: JSON.stringify(nextItems),
    };
    setNetWorthItems(nextItems);
    setError("");
    try {
      await persistProfile(nextProfile, previousProfile, setIsSavingNetWorth);
    } catch {
      setNetWorthItems(previousItems);
      setError("Could not remove this item. Try again.");
    }
  }

  function closeUpcomingModal() {
    setIsAddUpcomingOpen(false);
    setEditingUpcomingLine(null);
  }

  function closeGoalModal() {
    setIsAddGoalOpen(false);
    setEditingGoalLine(null);
  }

  async function persistProfile(
    nextProfile: FinanceProfile,
    previousProfile: FinanceProfile,
    setSaving: (value: boolean) => void,
  ) {
    setProfile(nextProfile);
    setSaving(true);
    setError("");

    try {
      await saveUserProfile(user?.id, nextProfile);
    } catch {
      setProfile(previousProfile);
      throw new Error("save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveUpcomingExpense(line: string) {
    if (editingUpcomingLine) {
      await handleEditUpcomingExpense(editingUpcomingLine, line);
      return;
    }

    const previousProfile = profile;
    const nextProfile: FinanceProfile = {
      ...profile,
      upcomingExpenses: appendUpcomingExpense(profile.upcomingExpenses, line),
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingUpcoming);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I added an upcoming expense: ${line}` },
      {
        role: "assistant",
        content: `Added **${line}** to your Upcoming list. Use **Plan for this** on that item when you want help budgeting for it.`,
      },
    ]);
    closeUpcomingModal();
  }

  async function handleEditUpcomingExpense(oldLine: string, newLine: string) {
    if (oldLine === newLine) {
      closeUpcomingModal();
      return;
    }

    const previousProfile = profile;
    const nextProfile: FinanceProfile = {
      ...profile,
      upcomingExpenses: replaceUpcomingLine(
        profile.upcomingExpenses,
        oldLine,
        newLine,
      ),
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingUpcoming);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I updated an upcoming expense to: ${newLine}` },
      {
        role: "assistant",
        content: `Updated your Upcoming list: **${newLine}** (was "${oldLine}").`,
      },
    ]);
    closeUpcomingModal();
  }

  async function handleSaveSavingsGoal(line: string) {
    if (editingGoalLine) {
      await handleEditSavingsGoal(editingGoalLine, line);
      return;
    }

    const previousProfile = profile;
    const nextProfile: FinanceProfile = {
      ...profile,
      savingsGoals: appendSavingsGoal(profile.savingsGoals, line),
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingGoal);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I added a savings goal: ${line}` },
      {
        role: "assistant",
        content: `Added **${line}** to your Goals list. Use **Plan for this** on that item when you want help reaching it.`,
      },
    ]);
    closeGoalModal();
  }

  async function handleEditSavingsGoal(oldLine: string, newLine: string) {
    if (oldLine === newLine) {
      closeGoalModal();
      return;
    }

    const previousProfile = profile;
    const nextProfile: FinanceProfile = {
      ...profile,
      savingsGoals: replaceSavingsGoalLine(
        profile.savingsGoals,
        oldLine,
        newLine,
      ),
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingGoal);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I updated a savings goal to: ${newLine}` },
      {
        role: "assistant",
        content: `Updated your Goals list: **${newLine}** (was "${oldLine}").`,
      },
    ]);
    closeGoalModal();
  }

  const isSidePanelBusy =
    isLoading || isSavingUpcoming || isSavingGoal || isSavingNetWorth;

  return (
    <section className="chat-layout">
      <AddNetWorthItemModal
        isOpen={isAddNetWorthOpen}
        isSaving={isSavingNetWorth}
        editItem={editingNetWorthItem}
        onClose={closeNetWorthModal}
        onSave={handleSaveNetWorthItem}
      />
      <AddUpcomingExpenseModal
        isOpen={isAddUpcomingOpen}
        isSaving={isSavingUpcoming}
        editLine={editingUpcomingLine}
        onClose={closeUpcomingModal}
        onSave={handleSaveUpcomingExpense}
      />
      <AddSavingsGoalModal
        isOpen={isAddGoalOpen}
        isSaving={isSavingGoal}
        editLine={editingGoalLine}
        onClose={closeGoalModal}
        onSave={handleSaveSavingsGoal}
      />
      <aside className="dashboard-left-rail">
        {/* Panel 1: Net Worth */}
        <div className="side-panel">
          <div className="side-panel-header">
            <div className="side-panel-title">
              <TrendingUp aria-hidden="true" />
              <h2>Net Worth</h2>
            </div>
            <button
              type="button"
              className="side-panel-add-button secondary-button"
              disabled={isSidePanelBusy}
              onClick={() => {
                setEditingNetWorthItem(null);
                setIsAddNetWorthOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              Add
            </button>
          </div>
          {netWorthItems.length === 0 ? (
            <div className="side-panel-empty">
              <p>Add accounts, assets, and holdings to track your net worth.</p>
              <button
                type="button"
                className="primary-button side-panel-add-button--empty"
                disabled={isSidePanelBusy}
                onClick={() => {
                  setEditingNetWorthItem(null);
                  setIsAddNetWorthOpen(true);
                }}
              >
                <Plus aria-hidden="true" />
                Add first asset
              </button>
            </div>
          ) : (
            <>
              <ul className="nw-list">
                {netWorthItems.map((item) => (
                  <li key={item.id} className="nw-item">
                    <div className="nw-item-info">
                      <span className="nw-item-name">{item.name}</span>
                      <span className="nw-type-badge">{item.type}</span>
                    </div>
                    <div className="nw-item-actions">
                      <span className="nw-item-amount">
                        ${(parseFloat(item.amount) || 0).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className="nw-edit-btn"
                        aria-label={`Edit ${item.name}`}
                        disabled={isSidePanelBusy}
                        onClick={() => {
                          setEditingNetWorthItem(item);
                          setIsAddNetWorthOpen(true);
                        }}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="nw-delete-btn"
                        aria-label={`Remove ${item.name}`}
                        disabled={isSidePanelBusy}
                        onClick={() => void handleDeleteNetWorthItem(item.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="side-panel-footnote">
                Total <strong>${totalNetWorth.toLocaleString()}</strong>
              </p>
            </>
          )}
        </div>

        {/* Panel 2: Upcoming Expenses */}
        <div className="side-panel">
          <div className="side-panel-header">
            <div className="side-panel-title">
              <CalendarDays aria-hidden="true" />
              <h2>Upcoming</h2>
            </div>
          </div>
          {upcomingItems.length === 0 ? (
            <p className="side-panel-empty">
              <span>No upcoming expenses yet.</span>
            </p>
          ) : (
            <ol className="upcoming-compact-list">
              {upcomingItems.map((item, index) => (
                <li key={index} className="upcoming-compact-item">
                  <span className="upcoming-compact-name">{item.label}</span>
                  <div className="upcoming-compact-row">
                    {item.urgencyLabel && (
                      <span className="upcoming-compact-date">
                        {item.urgencyLabel}
                      </span>
                    )}
                    {item.amount !== undefined && (
                      <span className="upcoming-compact-amount">
                        ${item.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Panel 3: Monthly Summary */}
        <div className="side-panel">
          <div className="side-panel-header">
            <div className="side-panel-title">
              <BarChart3 aria-hidden="true" />
              <h2>Monthly</h2>
            </div>
          </div>
          <dl className="monthly-summary">
            <div className="monthly-row">
              <dt>Income</dt>
              <dd>
                {monthlySummary.income > 0
                  ? `$${monthlySummary.income.toLocaleString()}`
                  : "—"}
              </dd>
            </div>
            <div className="monthly-row">
              <dt>Expenses</dt>
              <dd>${Math.round(monthlySummary.expenses).toLocaleString()}</dd>
            </div>
            <div className="monthly-row monthly-row--highlight">
              <dt>Remaining</dt>
              <dd
                className={
                  monthlySummary.remaining >= 0
                    ? "monthly-positive"
                    : "monthly-negative"
                }
              >
                {monthlySummary.income > 0
                  ? `$${Math.round(monthlySummary.remaining).toLocaleString()}`
                  : "—"}
              </dd>
            </div>
          </dl>
          <Link
            to="/onboarding"
            className="text-link"
            style={{ fontSize: "0.82rem" }}
          >
            Edit profile
          </Link>
        </div>
      </aside>

      <div className="chat-panel">
        {isProfileLoading && (
          <p className="status-message">Loading your saved profile...</p>
        )}
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`message ${message.role}`}
            >
              <ChatMessageContent
                content={message.content}
                variant={message.role}
              />
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              Thinking through your plan...
            </div>
          )}
        </div>

        <div className="quick-prompts" aria-busy={isSuggestionsLoading}>
          {isSuggestionsLoading && suggestedPrompts.length === 0 ? (
            <p className="quick-prompts-status">Updating suggestions...</p>
          ) : (
            suggestedPrompts.map((prompt, index) => (
              <button
                key={`${index}-${prompt}`}
                type="button"
                disabled={isLoading || isSuggestionsLoading}
                onClick={() => void sendMessage(prompt)}
              >
                <Sparkles aria-hidden="true" />
                {prompt}
              </button>
            ))
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            value={input}
            placeholder="Ask about budgeting, savings, upcoming costs..."
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit" className="primary-button" disabled={isLoading}>
            <Send aria-hidden="true" />
            Send
          </button>
        </form>
        <p className="disclaimer">
          FiHo uses your profile to guide budgeting, cash flow, debt, savings,
          and future goals.
        </p>
      </div>

      <aside className="chat-right-rail chat-right-rail--sidebar">
        <SavingsGoalsPanel
          raw={profile.savingsGoals}
          onAsk={sendMessage}
          onOpenAdd={() => {
            setEditingGoalLine(null);
            setIsAddGoalOpen(true);
          }}
          onEdit={(line) => {
            setEditingGoalLine(line);
            setIsAddGoalOpen(true);
          }}
          isLoading={isSidePanelBusy}
          className="goals-panel--sidebar"
        />
        <UpcomingExpensesPanel
          raw={profile.upcomingExpenses}
          onAsk={sendMessage}
          onOpenAdd={() => {
            setEditingUpcomingLine(null);
            setIsAddUpcomingOpen(true);
          }}
          onEdit={(line) => {
            setEditingUpcomingLine(line);
            setIsAddUpcomingOpen(true);
          }}
          isLoading={isSidePanelBusy}
          className="upcoming-panel--sidebar"
        />
      </aside>
    </section>
  );
}
