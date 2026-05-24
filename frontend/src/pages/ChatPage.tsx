import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles } from "lucide-react";
import { loadProfile } from "../lib/profileStorage";
import type { ChatMessage } from "../types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

const starterPrompts = [
  "Create a monthly budget for me.",
  "Can I afford a trip in 4 months?",
  "What expenses should I reduce first?"
];

export default function ChatPage() {
  const [profile] = useState(() => loadProfile());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I can help you turn your profile into a practical budget or savings plan. What would you like to plan first?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    setMessages((current) => [...current, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, profile })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = (await response.json()) as { reply: string };
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Could not reach the backend. Make sure npm run dev is running.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="chat-layout">
      <aside className="profile-summary">
        <p className="eyebrow">Step 2</p>
        <h1>Ask your financial consultant.</h1>
        <p>
          Profile completeness: <strong>{filledFields}/9</strong>
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
          <div>
            <dt>Goals</dt>
            <dd>{profile.savingsGoals || "Not set"}</dd>
          </div>
        </dl>
        <Link to="/" className="text-link">
          Edit onboarding
        </Link>
      </aside>

      <div className="chat-panel">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              {message.content}
            </div>
          ))}
          {isLoading && <div className="message assistant">Thinking through your plan...</div>}
        </div>

        <div className="quick-prompts">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => void sendMessage(prompt)}>
              <Sparkles aria-hidden="true" />
              {prompt}
            </button>
          ))}
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
          Educational guidance only, not professional financial, tax, legal, or investment advice.
        </p>
      </div>
    </section>
  );
}
