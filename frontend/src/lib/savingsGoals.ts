export type SavingsGoalItem = {
  label: string;
  amount?: number;
  timelineLabel?: string;
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

function parseTimeline(line: string): string | undefined {
  const weeks = line.match(WEEKS_PATTERN);
  if (weeks) {
    return `${weeks[1]} weeks`;
  }

  const months = line.match(MONTHS_PATTERN);
  if (months) {
    return `${months[1]} months`;
  }

  const byMatch = line.match(
    /\bby\s+([A-Za-z]+(?:\s+\d{1,2})?(?:\s+\d{4})?)\b/i,
  );
  if (byMatch) {
    return `By ${byMatch[1]}`;
  }

  return undefined;
}

export function formatSavingsGoalLine(parts: {
  description: string;
  amount?: string;
  timeline?: string;
}): string {
  const description = parts.description.trim();
  const amount = parts.amount?.trim().replace(/[^0-9.]/g, "");
  const timeline = parts.timeline?.trim();

  if (!description) {
    return "";
  }

  let line = description;
  if (amount) {
    line += ` $${amount}`;
  }
  if (timeline) {
    line += ` ${timeline}`;
  }

  return line.trim();
}

export { replaceProfileLine } from "./profileLines";

export function appendSavingsGoal(raw: string, newLine: string): string {
  const line = newLine.trim();
  if (!line) {
    return raw;
  }

  if (!raw.trim()) {
    return line;
  }

  return `${raw.trim()}\n${line}`;
}

type StructuredGoalRow = {
  id?: string;
  name?: string;
  amount?: string;
  type?: string;
  target?: string;
};

function parseTargetMonths(targetStr: string): number | undefined {
  if (!targetStr) return undefined;
  const yearOnly = targetStr.match(/^(\d{4})$/);
  if (yearOnly) {
    const now = new Date();
    const months =
      (parseInt(yearOnly[1], 10) - now.getFullYear()) * 12 - now.getMonth();
    return months > 0 ? months : undefined;
  }
  try {
    const d = new Date(targetStr + "T00:00:00");
    if (!isNaN(d.getTime())) {
      const diffMs = d.getTime() - Date.now();
      const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      return months > 0 ? months : undefined;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function tryParseStructuredGoals(raw: string): SavingsGoalItem[] | null {
  if (!raw.trim().startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const rows = parsed as StructuredGoalRow[];
    return rows
      .map((row): SavingsGoalItem | null => {
        const name = row.name?.trim() ?? "";
        if (!name) return null;
        const amountVal = row.amount?.trim()
          ? parseFloat(row.amount)
          : undefined;
        const amount =
          amountVal !== undefined && Number.isFinite(amountVal) && amountVal > 0
            ? amountVal
            : undefined;
        const timelineLabel = row.target?.trim() || undefined;
        const monthsUntil = parseTargetMonths(row.target ?? "");
        return { label: name, amount, timelineLabel, monthsUntil };
      })
      .filter((item): item is SavingsGoalItem => item !== null);
  } catch {
    return null;
  }
}

export function parseSavingsGoals(raw: string): SavingsGoalItem[] {
  if (!raw.trim()) {
    return [];
  }

  const structured = tryParseStructuredGoals(raw);
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
      timelineLabel: parseTimeline(line),
    }));
}

/** Rough monthly savings needed across goals that include amount and timeline hints. */
export function estimateMonthlySavingsForGoals(
  items: SavingsGoalItem[],
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
    }
  }

  return counted > 0 ? Math.round(total) : null;
}
