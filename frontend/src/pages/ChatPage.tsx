import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles } from "lucide-react";
import AddSavingsGoalModal from "../components/AddSavingsGoalModal";
import AddUpcomingExpenseModal from "../components/AddUpcomingExpenseModal";
import ChatMessageContent from "../components/ChatMessageContent";
import SavingsGoalsPanel from "../components/SavingsGoalsPanel";
import UpcomingExpensesPanel from "../components/UpcomingExpensesPanel";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_SUGGESTION_PROMPTS,
  fetchChatSuggestions,
  sendChatMessage
} from "../lib/chatApi";
import { loadUserProfile, saveUserProfile } from "../lib/profileRepository";
import { emptyProfile } from "../lib/profileStorage";
import { appendSavingsGoal, replaceProfileLine as replaceSavingsGoalLine } from "../lib/savingsGoals";
import {
  appendUpcomingExpense,
  replaceProfileLine as replaceUpcomingLine
} from "../lib/upcomingExpenses";
import type { ChatMessage, FinanceProfile } from "../types";

const initialAssistantMessage =
  "I can help you turn your profile into a practical budget or savings plan. What would you like to plan first?";

export default function ChatPage() {
  const { user, fullName } = useAuth();
  const [profile, setProfile] = useState<FinanceProfile>(emptyProfile);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage }
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState(DEFAULT_SUGGESTION_PROMPTS);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddUpcomingOpen, setIsAddUpcomingOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingUpcomingLine, setEditingUpcomingLine] = useState<string | null>(null);
  const [editingGoalLine, setEditingGoalLine] = useState<string | null>(null);
  const [isSavingUpcoming, setIsSavingUpcoming] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
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
          fullName: savedProfile.fullName || fullName
        });
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
    [profile]
  );

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }

    void refreshSuggestions(messages);
  }, [isProfileLoading, messages, refreshSuggestions]);

  const filledFields = useMemo(
    () => Object.values(profile).filter((value) => value.trim().length > 0).length,
    [profile]
  );

  async function sendMessage(message: string) {
    if (!message.trim() || isLoading) {
      return;
    }

    setError("");
    setInput("");

    const previousMessages = messages;
    const nextMessages: ChatMessage[] = [
      ...previousMessages,
      { role: "user", content: message.trim() }
    ];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(nextMessages, profile);
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(previousMessages);
      setError("Could not reach the backend. Make sure npm run dev is running.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
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
    setSaving: (value: boolean) => void
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
      upcomingExpenses: appendUpcomingExpense(profile.upcomingExpenses, line)
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingUpcoming);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I added an upcoming expense: ${line}` },
      {
        role: "assistant",
        content: `Added **${line}** to your Upcoming list. Use **Plan for this** on that item when you want help budgeting for it.`
      }
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
      upcomingExpenses: replaceUpcomingLine(profile.upcomingExpenses, oldLine, newLine)
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingUpcoming);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I updated an upcoming expense to: ${newLine}` },
      {
        role: "assistant",
        content: `Updated your Upcoming list: **${newLine}** (was "${oldLine}").`
      }
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
      savingsGoals: appendSavingsGoal(profile.savingsGoals, line)
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingGoal);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I added a savings goal: ${line}` },
      {
        role: "assistant",
        content: `Added **${line}** to your Goals list. Use **Plan for this** on that item when you want help reaching it.`
      }
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
      savingsGoals: replaceSavingsGoalLine(profile.savingsGoals, oldLine, newLine)
    };

    await persistProfile(nextProfile, previousProfile, setIsSavingGoal);

    setMessages((current) => [
      ...current,
      { role: "user", content: `I updated a savings goal to: ${newLine}` },
      {
        role: "assistant",
        content: `Updated your Goals list: **${newLine}** (was "${oldLine}").`
      }
    ]);
    closeGoalModal();
  }

  const isSidePanelBusy = isLoading || isSavingUpcoming || isSavingGoal;

  return (
    <section className="chat-layout">
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
      <aside className="profile-summary">
        <p className="eyebrow">Step 2</p>
        <h1>
          {profile.fullName
            ? `${profile.fullName}'s financial consultant.`
            : "Ask your financial consultant."}
        </h1>
        <p>
          Profile completeness: <strong>{filledFields}/10</strong>
        </p>
        <dl>
          <div>
            <dt>Income</dt>
            <dd>{profile.monthlyIncome ? `$${profile.monthlyIncome}/month` : "Not set"}</dd>
          </div>
          <div>
            <dt>Housing</dt>
            <dd>{profile.housingCost ? `$${profile.housingCost}/month` : "Not set"}</dd>
          </div>
        </dl>
        <Link to="/onboarding" className="text-link">
          Edit onboarding
        </Link>
      </aside>

      <div className="chat-panel">
        {isProfileLoading && <p className="status-message">Loading your saved profile...</p>}
        <div className="messages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <ChatMessageContent content={message.content} variant={message.role} />
            </div>
          ))}
          {isLoading && <div className="message assistant">Thinking through your plan...</div>}
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

        <div className="chat-side-panels-inline">
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
            className="goals-panel--inline"
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
            className="upcoming-panel--inline"
          />
        </div>

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
          FiHo uses your profile to guide budgeting, cash flow, debt, savings, and future goals.
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
