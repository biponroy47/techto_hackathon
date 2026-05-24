export const FINANCE_ASSISTANT_SYSTEM_PROMPT = `You are FiHo, a friendly personal financial guidance assistant.

Your job is to help users budget, save, and plan spending using only the profile information provided. Write like a supportive coach speaking to a real person—not like software, a spreadsheet, or an API.

Tone and language:
- Use natural, conversational English. Prefer full sentences over labels or formulas alone.
- Address the user as "you". Be practical, encouraging, and beginner-friendly.
- You may use light markdown when it helps readability: **bold** for emphasis, short bullet or numbered lists when comparing options.
- When you include a calculation, weave it into prose (e.g. "With about $1,162 available over 4 months, that works out to roughly **$290 per month** for trip-related costs.").

Strict formatting rules:
- NEVER use camelCase, PascalCase identifiers, variable names, or pseudo-code labels (e.g. MaxAllowedTripExpensePerMonth, HousingCost, monthlyIncome).
- NEVER echo internal database or form field names from the profile.
- Use plain-English headings only when needed (e.g. "Monthly trip budget", "What to cut first")—not technical keys.
- Do not output JSON, key-value dumps, or "Field: value" lines unless the user explicitly asked for a table.

Safety and scope:
- Do not claim to be a licensed financial advisor.
- Avoid legal, tax, or investment guarantees; keep guidance educational and general.
- If important profile data is missing, state one reasonable assumption or ask one brief clarifying question.

Answer structure (keep concise):
1. Directly answer the user's question in the first 1–2 sentences.
2. Support with specific numbers from their profile when available.
3. End with one or two concrete next steps they can take this week.`;

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
      return `- ${label}: ${formatProfileValue(key, value!.trim())}`;
    })
    .join("\n");
}

function formatProfileValue(key: string, value: string) {
  if (!["subscriptions", "recurringExpenses", "debts", "upcomingExpenses", "savingsGoals"].includes(key)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return "None listed";
    }

    return parsed.map((item) => formatListItem(key, item)).join("; ");
  } catch {
    return value;
  }
}

function formatListItem(key: string, item: unknown) {
  if (!item || typeof item !== "object") {
    return String(item);
  }

  const record = item as Record<string, unknown>;
  const name = valueOrFallback(record.name, "Unnamed");

  if (key === "subscriptions" || key === "recurringExpenses") {
    return `${name} costs $${valueOrFallback(record.cost, "0")} ${valueOrFallback(record.basis, "monthly")} on ${valueOrFallback(record.recurringDate, "unspecified date")}`;
  }

  if (key === "debts") {
    const interest = record.interestRate ? ` at ${record.interestRate}% interest` : "";
    return `${name} ${valueOrFallback(record.type, "debt")} balance $${valueOrFallback(record.amount, "0")}${interest}`;
  }

  if (key === "upcomingExpenses") {
    return `${name} ${valueOrFallback(record.type, "expense")} costs $${valueOrFallback(record.cost, "0")} on ${valueOrFallback(record.date, "unspecified date")}`;
  }

  if (key === "savingsGoals") {
    const target = record.target ? ` by ${record.target}` : "";
    return `${name} ${valueOrFallback(record.type, "goal")} target $${valueOrFallback(record.amount, "0")}${target}`;
  }

  return name;
}

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
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

export const DEFAULT_SUGGESTION_PROMPTS = [
  "Create a monthly budget for me.",
  "Can I afford a trip in 4 months?",
  "What expenses should I reduce first?"
];

export const SUGGESTIONS_SYSTEM_PROMPT = `You generate follow-up question chips for a personal finance chat app.

Return ONLY valid JSON: an array of exactly 3 strings. No markdown fences, no commentary, no keys.

Each string must:
- Be a short question the user would tap to send next (about 6–14 words)
- Use natural conversational English (never camelCase or variable names)
- Be a logical next step given the profile and conversation so far
- Differ from each other (e.g. drill down, compare options, plan next action)
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

Generate 3 follow-up questions the user is likely to ask next. Output JSON only.`;
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
      .slice(0, 3);

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
    if (result.length >= 3) {
      break;
    }

    if (!result.some((item) => item.toLowerCase() === prompt.toLowerCase())) {
      result.push(prompt);
    }
  }

  return result.slice(0, 3);
}

export function buildMockSuggestions(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  profile: Record<string, string | undefined>
): string[] {
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const hasIncome = Boolean(profile.monthlyIncome?.trim());
  const hasGoals = Boolean(profile.savingsGoals?.trim());

  if (lastUser.includes("trip") || lastUser.includes("travel") || lastUser.includes("vacation")) {
    return [
      "What should I cut to fund this trip?",
      "Show me a weekly savings plan for it.",
      "What if the trip costs more than expected?"
    ];
  }

  if (lastUser.includes("budget")) {
    return [
      "How much should go to needs vs wants?",
      "Where does my housing cost fit in?",
      "What is one expense I should trim first?"
    ];
  }

  if (lastUser.includes("reduce") || lastUser.includes("cut") || lastUser.includes("save")) {
    return [
      "Which subscription should I cancel first?",
      "How much could I save per month?",
      "Help me set a realistic savings target."
    ];
  }

  if (!hasIncome) {
    return [
      "Help me estimate a monthly budget.",
      "What info do you need from my profile?",
      "What should I track in onboarding?"
    ];
  }

  if (!hasGoals) {
    return [
      "What savings goal should I set first?",
      "How much can I save each month?",
      "Can I afford a purchase in 3 months?"
    ];
  }

  return DEFAULT_SUGGESTION_PROMPTS;
}
