export type UpcomingExpenseItem = {
  label: string;
  amount?: number;
  urgencyLabel?: string;
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

export function parseUpcomingExpenses(raw: string): UpcomingExpenseItem[] {
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(/\n|;/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((line) => ({
      label: line,
      amount: parseAmount(line),
      urgencyLabel: parseUrgency(line)
    }));
}

/** Rough monthly savings needed across items that include amount and timing hints. */
export function estimateMonthlySetAside(items: UpcomingExpenseItem[]): number | null {
  let total = 0;
  let counted = 0;

  for (const item of items) {
    if (item.amount === undefined) {
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
