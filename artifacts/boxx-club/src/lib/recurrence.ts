// Logica condivisa per le date degli eventi ricorrenti
type RecurringEvent = {
  date: string;
  isRecurring?: boolean | null;
  recurringPattern?: string | null;
  recurringUntil?: string | null;
};

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayString(): string {
  return toISO(new Date());
}

export function endOfNextMonthISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  d.setDate(0);
  return toISO(d);
}

export const WEEKLY_DOW: Record<string, number> = {
  "tutti-i-mercoledi": 3,
  "tutti-i-venerdi": 5,
  "tutti-i-sabati": 6,
};

export const NTH_SAT: Record<string, number> = {
  "primo-sabato": 1,
  "secondo-sabato": 2,
  "terzo-sabato": 3,
  "quarto-sabato": 4,
};

export function generateOccurrences(event: RecurringEvent, fromISOStr: string, toISOStr: string): string[] {
  const from = new Date(fromISOStr + "T00:00:00");
  const to = new Date(toISOStr + "T00:00:00");
  if (to < from) return [];
  const pattern = event.recurringPattern ?? "";
  const out: string[] = [];

  if (pattern in WEEKLY_DOW) {
    const dow = WEEKLY_DOW[pattern];
    const cursor = new Date(from);
    while (cursor.getDay() !== dow) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= to) {
      out.push(toISO(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }

  if (pattern in NTH_SAT) {
    const n = NTH_SAT[pattern];
    const monthCursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (monthCursor <= to) {
      const firstDow = monthCursor.getDay();
      const offset = (6 - firstDow + 7) % 7;
      const day = 1 + offset + (n - 1) * 7;
      const cand = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
      if (cand.getMonth() === monthCursor.getMonth() && cand >= from && cand <= to) {
        out.push(toISO(cand));
      }
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    return out;
  }

  if (event.date >= fromISOStr && event.date <= toISOStr) out.push(event.date);
  return out;
}

// La prossima serata (>= oggi) di un evento ricorrente; null se la serie è finita
export function nextOccurrence(event: RecurringEvent): string | null {
  if (!event.isRecurring) return null;
  const today = todayString();
  // cerca fino a ~4 mesi avanti
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + 4);
  let cap = toISO(horizon);
  if (event.recurringUntil && event.recurringUntil < cap) cap = event.recurringUntil;
  if (cap < today) return null;
  const startFrom = event.date > today ? event.date : today;
  const occ = generateOccurrences(event, startFrom, cap);
  return occ[0] ?? null;
}
