export type UpcomingExpenseItem = {
  label: string;
  amount?: number;
  urgencyLabel?: string;
  monthsUntil?: number;
};

const AMOUNT_PATTERN = /\$?\s*([\d,]+(?:\.\d{2})?)/;
const WEEKS_PATTERN = /\bin\s+(\d+)\s+weeks?\b/i;
const MONTHS_PATTERN = /\bin\s+(\d+)\s+months?\b/i;

function parseAmount(line: string): number | undefined {
  const match = line.match(AMOUNT_PATTERN);
  if (!match) {
    return undefined;
  }

  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : undefined;
}

function parseUrgency(line: string): string | undefined {
  const weeks = line.match(WEEKS_PATTERN);
  if (weeks) {
    return `${weeks[1]} weeks`;
  }

  const months = line.match(MONTHS_PATTERN);
  if (months) {
    return `${months[1]} months`;
  }

  if (/\bthis month\b/i.test(line)) {
    return "This month";
  }

  const dueMatch = line.match(/\b(?:due|by)\s+([A-Za-z]+\s+\d{1,2})\b/i);
  if (dueMatch) {
    return `Due ${dueMatch[1]}`;
  }

  return undefined;
}

export function formatUpcomingExpenseLine(parts: {
  description: string;
  amount?: string;
  timing?: string;
}): string {
  const description = parts.description.trim();
  const amount = parts.amount?.trim().replace(/[^0-9.]/g, "");
  const timing = parts.timing?.trim();

  if (!description) {
    return "";
  }

  let line = description;
  if (amount) {
    line += ` $${amount}`;
  }
  if (timing) {
    line += ` ${timing}`;
  }

  return line.trim();
}

export { replaceProfileLine } from "./profileLines";

export function appendUpcomingExpense(raw: string, newLine: string): string {
  const line = newLine.trim();
  if (!line) {
    return raw;
  }

  if (!raw.trim()) {
    return line;
  }

  return `${raw.trim()}\n${line}`;
}

type StructuredUpcomingRow = {
  id?: string;
  name?: string;
  cost?: string;
  date?: string;
  type?: string;
};

function parseDateLabel(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return undefined;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return undefined;
  }
}

function parseDateMonths(dateStr: string): number | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return undefined;
    const diffMs = d.getTime() - Date.now();
    const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    return months > 0 ? months : undefined;
  } catch {
    return undefined;
  }
}

function tryParseStructuredUpcoming(raw: string): UpcomingExpenseItem[] | null {
  if (!raw.trim().startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const rows = parsed as StructuredUpcomingRow[];
    const sorted = [...rows].sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });
    return sorted
      .map((row): UpcomingExpenseItem | null => {
        const name = row.name?.trim() ?? "";
        if (!name) return null;
        const costVal = row.cost?.trim() ? parseFloat(row.cost) : undefined;
        const amount =
          costVal !== undefined && Number.isFinite(costVal) && costVal > 0
            ? costVal
            : undefined;
        const urgencyLabel = parseDateLabel(row.date ?? "");
        const monthsUntil = parseDateMonths(row.date ?? "");
        return { label: name, amount, urgencyLabel, monthsUntil };
      })
      .filter((item): item is UpcomingExpenseItem => item !== null);
  } catch {
    return null;
  }
}

export function parseUpcomingExpenses(raw: string): UpcomingExpenseItem[] {
  if (!raw.trim()) {
    return [];
  }

  const structured = tryParseStructuredUpcoming(raw);
  if (structured !== null) {
    return structured;
  }

  return raw
    .split(/\n|;/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((line) => ({
      label: line,
      amount: parseAmount(line),
      urgencyLabel: parseUrgency(line),
    }));
}

/** Rough monthly savings needed across items that include amount and timing hints. */
export function estimateMonthlySetAside(
  items: UpcomingExpenseItem[],
): number | null {
  let total = 0;
  let counted = 0;

  for (const item of items) {
    if (item.amount === undefined) {
      continue;
    }

    if (item.monthsUntil !== undefined && item.monthsUntil > 0) {
      total += item.amount / item.monthsUntil;
      counted += 1;
      continue;
    }

    const line = item.label;
    const months = line.match(MONTHS_PATTERN);
    if (months) {
      const monthCount = Number.parseInt(months[1], 10);
      if (monthCount > 0) {
        total += item.amount / monthCount;
        counted += 1;
      }
      continue;
    }

    const weeks = line.match(WEEKS_PATTERN);
    if (weeks) {
      const weekCount = Number.parseInt(weeks[1], 10);
      if (weekCount > 0) {
        total += item.amount / (weekCount / 4.33);
        counted += 1;
      }
      continue;
    }

    if (/\bthis month\b/i.test(line)) {
      total += item.amount;
      counted += 1;
    }
  }

  return counted > 0 ? Math.round(total) : null;
}
