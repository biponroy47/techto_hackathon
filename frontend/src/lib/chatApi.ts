import type { ChatMessage, FinanceProfile } from "../types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const SUGGESTION_CHIP_COUNT = 2;

export const DEFAULT_SUGGESTION_PROMPTS = [
  "Build my monthly budget",
  "What should I cut first?"
];

type ChatResponse = {
  reply: string;
  mode?: string;
};

type SuggestionsResponse = {
  suggestions: string[];
  mode?: string;
};

export async function sendChatMessage(messages: ChatMessage[], profile: FinanceProfile) {
  const response = await fetch(`${apiUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile })
  });

  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  return (await response.json()) as ChatResponse;
}

export async function fetchChatSuggestions(
  messages: ChatMessage[],
  profile: FinanceProfile
): Promise<string[]> {
  const response = await fetch(`${apiUrl}/api/chat/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile })
  });

  if (!response.ok) {
    throw new Error("Suggestions request failed");
  }

  const data = (await response.json()) as SuggestionsResponse;
  const suggestions = data.suggestions?.filter((item) => item.trim().length > 0) ?? [];

  return suggestions.length > 0
    ? suggestions.slice(0, SUGGESTION_CHIP_COUNT)
    : DEFAULT_SUGGESTION_PROMPTS;
}
