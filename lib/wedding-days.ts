/**
 * Single source of truth for the three wedding days.
 *
 * These labels previously lived in two places — the RSVP form
 * (app/rsvp/page.tsx) and the admin query layer (lib/admin-queries.ts) —
 * which meant renaming an event silently desynced the guest-facing form from
 * the admin panel. Everything now reads from here.
 *
 * The `id` values are the exact strings persisted in the Postgres
 * `rsvps.days_attending` text[] column. Changing one is a data migration,
 * not a copy edit.
 */

export const WEDDING_DAYS = [
  {
    id: 'day1',
    date: '30 Oct 2026',
    shortDate: '30 Oct',
    label: 'Fabi Mehandi',
    /** Compact label for dense UI like table pills. */
    short: 'Mehandi',
    /** Accent used for pills/chips so each event is recognisable at a glance. */
    accent: '#a6814e',
  },
  {
    id: 'day2',
    date: '31 Oct 2026',
    shortDate: '31 Oct',
    label: "Molutty's Haldi & Sangeeth",
    short: 'Haldi & Sangeeth',
    accent: '#6d8a5f',
  },
  {
    id: 'day3',
    date: '01 Nov 2026',
    shortDate: '01 Nov',
    label: 'The Fabi Big Day',
    short: 'Big Day',
    accent: '#b0813c',
  },
] as const;

/** Union of the valid persisted ids: 'day1' | 'day2' | 'day3'. */
export type DayId = (typeof WEDDING_DAYS)[number]['id'];

export type WeddingDay = (typeof WEDDING_DAYS)[number];

export const DAY_IDS = WEDDING_DAYS.map((d) => d.id) as readonly DayId[];

const DAY_BY_ID = new Map<string, WeddingDay>(WEDDING_DAYS.map((d) => [d.id, d]));

/** Narrowing type guard for untrusted input (URL params, DB rows). */
export function isDayId(value: unknown): value is DayId {
  return typeof value === 'string' && DAY_BY_ID.has(value);
}

export function getDay(id: string): WeddingDay | undefined {
  return DAY_BY_ID.get(id);
}

/**
 * Keep only recognised day ids, in canonical chronological order.
 * Guards the admin UI against stale or malformed values in the column.
 */
export function normaliseDays(days: readonly string[] | null | undefined): DayId[] {
  if (!days || days.length === 0) return [];
  const present = new Set(days);
  return DAY_IDS.filter((id) => present.has(id));
}

/** Human-readable summary, e.g. "30 Oct · Fabi Mehandi, 01 Nov · The Fabi Big Day". */
export function formatDays(days: readonly string[] | null | undefined): string {
  const valid = normaliseDays(days);
  if (valid.length === 0) return '—';
  return valid
    .map((id) => {
      const day = getDay(id)!;
      return `${day.shortDate} · ${day.label}`;
    })
    .join(', ');
}

/** Parses a comma-separated URL param such as "day1,day3" into valid ids. */
export function parseDayParam(raw: string | string[] | undefined): DayId[] {
  if (!raw) return [];
  const flat = Array.isArray(raw) ? raw.join(',') : raw;
  return normaliseDays(flat.split(',').map((s) => s.trim()));
}
