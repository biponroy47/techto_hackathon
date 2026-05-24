export const FINANCE_ASSISTANT_SYSTEM_PROMPT = `You are a friendly financial planning assistant in a personal finance app demo.

Your job is to help users budget, save, and plan spending using only the profile information provided. Write like a supportive coach speaking to a real person—not like software, a spreadsheet, or an API.

Tone and language:
- Use natural, conversational English. Prefer full sentences over labels or formulas alone.
- Address the user as "you". Be practical, encouraging, and beginner-friendly.
- Use markdown for scanability: **bold** for dollar amounts and key conclusions, short lists, and ### subheadings for sections.
- When you include a calculation, weave it into prose (e.g. "With about $1,162 available over 4 months, that works out to roughly **$290 per month** for trip-related costs.").

Response layout (important for readability):
- Start with **one sentence** that directly answers the question (the bottom line).
- Use ### subheadings to break longer answers into 2–4 short sections (e.g. "### Summary", "### Numbers", "### This week"). Do not use more than four sections.
- Keep paragraphs to 1–3 sentences. Add a blank line between paragraphs.
- Use bullet lists (- item) for steps or options; keep lists to at most 4 items.
- Put every dollar figure in **bold** (e.g. **$290/month**).
- End with a "### Next steps" section containing 1–2 numbered actions when giving advice.

Strict formatting rules:
- NEVER use camelCase, PascalCase identifiers, variable names, or pseudo-code labels (e.g. MaxAllowedTripExpensePerMonth, HousingCost, monthlyIncome).
- NEVER echo internal database or form field names from the profile.
- Use plain-English headings only when needed (e.g. "Monthly trip budget", "What to cut first")—not technical keys.
- Do not output JSON, key-value dumps, or "Field: value" lines unless the user explicitly asked for a table.

Safety and scope:
- Do not claim to be a licensed financial advisor.
- Avoid legal, tax, or investment guarantees; keep guidance educational and general.
- If important profile data is missing, state one reasonable assumption or ask one brief clarifying question.

Keep the full answer concise (roughly 120–220 words unless the user asked for a detailed plan).`;

export const PROFILE_FIELD_LABELS: Record<string, string> = {
  fullName: "Name",
  occupation: "Occupation",
  status: "Life / employment status",
  monthlyIncome: "Monthly income",
  housingCost: "Housing cost",
  subscriptions: "Subscriptions",
  recurringExpenses: "Recurring expenses",
  debts: "Debts",
  upcomingExpenses: "Upcoming expenses",
  savingsGoals: "Savings goals"
};

export function formatProfileForPrompt(profile: Record<string, string | undefined>) {
  return Object.entries(profile)
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([key, value]) => {
      const label = PROFILE_FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
      return `- ${label}: ${value!.trim()}`;
    })
    .join("\n");
}

export function buildUserChatMessage(message: string, profileSummary: string) {
  const profileBlock = profileSummary
    ? `Here is the user's financial profile:\n${profileSummary}`
    : "The user has not completed their financial profile yet.";

  return `${profileBlock}

User question:
${message.trim()}

Respond in natural language following your system instructions.`;
}

export const SUGGESTION_CHIP_COUNT = 2;

export const DEFAULT_SUGGESTION_PROMPTS = [
  "Build my monthly budget",
  "What should I cut first?"
];

export const SUGGESTIONS_SYSTEM_PROMPT = `You generate follow-up question chips for a personal finance chat app.

Return ONLY valid JSON: an array of exactly ${SUGGESTION_CHIP_COUNT} strings. No markdown fences, no commentary, no keys.

Each string must:
- Be very short: about 4–8 words total (one brief line on screen)
- Be a tap-to-send question in natural English (never camelCase or variable names)
- Be a logical next step given the profile and conversation so far
- Differ from each other (e.g. drill down vs next action)
- NOT repeat a question the user already asked word-for-word`;

export function buildSuggestionsUserMessage(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  profileSummary: string
) {
  const transcript = messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content.trim()}`)
    .join("\n\n");

  return `Financial profile:
${profileSummary || "Profile not completed yet."}

Conversation so far:
${transcript}

Generate exactly ${SUGGESTION_CHIP_COUNT} short follow-up questions the user is likely to ask next. Output JSON only.`;
}

export function parseSuggestionsJson(raw: string): string[] | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const suggestions = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim().replace(/\s+/g, " "))
      .slice(0, SUGGESTION_CHIP_COUNT);

    return suggestions.length > 0 ? suggestions : null;
  } catch {
    return null;
  }
}

export function fillSuggestions(
  suggestions: string[],
  fallback: string[] = DEFAULT_SUGGESTION_PROMPTS
): string[] {
  const result = [...suggestions];

  for (const prompt of fallback) {
    if (result.length >= SUGGESTION_CHIP_COUNT) {
      break;
    }

    if (!result.some((item) => item.toLowerCase() === prompt.toLowerCase())) {
      result.push(prompt);
    }
  }

  return result.slice(0, SUGGESTION_CHIP_COUNT);
}

export function buildMockSuggestions(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  profile: Record<string, string | undefined>
): string[] {
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const hasIncome = Boolean(profile.monthlyIncome?.trim());
  const hasGoals = Boolean(profile.savingsGoals?.trim());

  if (lastUser.includes("trip") || lastUser.includes("travel") || lastUser.includes("vacation")) {
    return ["What should I cut for this trip?", "Weekly savings plan for it"];
  }

  if (lastUser.includes("budget")) {
    return ["Split needs vs wants?", "One expense to trim first"];
  }

  if (lastUser.includes("reduce") || lastUser.includes("cut") || lastUser.includes("save")) {
    return ["Which subscription to cancel?", "How much can I save monthly?"];
  }

  if (!hasIncome) {
    return ["Estimate my monthly budget", "What profile info do you need?"];
  }

  if (!hasGoals) {
    return ["First savings goal to set?", "How much can I save monthly?"];
  }

  return DEFAULT_SUGGESTION_PROMPTS;
}
