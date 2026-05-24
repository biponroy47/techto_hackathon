const AMOUNT_PATTERN = /\$?\s*([\d,]+(?:\.\d{2})?)/;
const WEEKS_PATTERN = /\bin\s+\d+\s+weeks?\b/i;
const MONTHS_PATTERN = /\bin\s+\d+\s+months?\b/i;
const THIS_MONTH_PATTERN = /\bthis month\b/i;
const DUE_BY_PATTERN = /\b(?:due|by)\s+[A-Za-z]+(?:\s+\d{1,2})?(?:\s+\d{4})?\b/i;

export type ProfileLineFormParts = {
  description: string;
  amount: string;
  timing: string;
};

export function splitProfileLines(raw: string): string[] {
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(/\n|;/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function joinProfileLines(lines: string[]): string {
  return lines.join("\n");
}

export function replaceProfileLine(raw: string, oldLine: string, newLine: string): string {
  const lines = splitProfileLines(raw);
  const index = lines.findIndex((line) => line === oldLine);

  if (index === -1) {
    return raw;
  }

  lines[index] = newLine.trim();
  return joinProfileLines(lines);
}

export function parseLineToFormParts(line: string): ProfileLineFormParts {
  let remaining = line.trim();
  let timing = "";

  const weeks = remaining.match(WEEKS_PATTERN);
  if (weeks) {
    timing = weeks[0];
    remaining = remaining.replace(WEEKS_PATTERN, "").trim();
  } else {
    const months = remaining.match(MONTHS_PATTERN);
    if (months) {
      timing = months[0];
      remaining = remaining.replace(MONTHS_PATTERN, "").trim();
    } else if (THIS_MONTH_PATTERN.test(remaining)) {
      timing = "this month";
      remaining = remaining.replace(THIS_MONTH_PATTERN, "").trim();
    } else {
      const dueBy = remaining.match(DUE_BY_PATTERN);
      if (dueBy) {
        timing = dueBy[0];
        remaining = remaining.replace(DUE_BY_PATTERN, "").trim();
      }
    }
  }

  const amountMatch = remaining.match(AMOUNT_PATTERN);
  const amount = amountMatch ? amountMatch[1].replace(/,/g, "") : "";
  if (amountMatch) {
    remaining = remaining.replace(amountMatch[0], "").trim();
  }

  remaining = remaining.replace(/^[-–—]\s*/, "").replace(/\s+/g, " ").trim();

  return {
    description: remaining,
    amount,
    timing
  };
}
