import { getServerSupabase, RsvpSubmission } from './supabase';
import {
  DAY_IDS,
  type DayId,
  formatDays,
  normaliseDays,
} from './wedding-days';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface DayStat {
  id: DayId;
  /** Number of RSVP submissions that include this day. */
  responses: number;
  /** Total head count across those submissions — the catering number. */
  guests: number;
}

export interface DashboardStats {
  totalResponses: number;
  totalGuests: number;
  accommodationNeeded: number;
  averagePartySize: number;
  recentResponses: number; // Last 7 days
  /** Attendance broken down per wedding day, in chronological order. */
  perDay: DayStat[];
}

export interface RsvpWithDetails extends Omit<RsvpSubmission, 'days_attending'> {
  /** Validated + chronologically ordered, never null. */
  days_attending: DayId[];
  formatted_date: string;
  days_attending_labels: string;
}

/** How to combine multiple selected days in the filter. */
export type DayMatchMode = 'any' | 'all';

export type SortBy = 'date_desc' | 'date_asc' | 'name_asc' | 'guests_desc';
export type AccommodationFilter = 'all' | 'yes' | 'no';

export interface RsvpFilters {
  searchTerm?: string;
  accommodationFilter?: AccommodationFilter;
  sortBy?: SortBy;
  /** Empty array means "no day filter". */
  days?: DayId[];
  dayMatchMode?: DayMatchMode;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', DATE_FORMAT);
}

/**
 * Makes a user-supplied search term safe to embed in a PostgREST `or()`
 * filter string.
 *
 * This matters: `or()` takes a raw mini-language where `,` separates
 * conditions and `.` separates column/operator/value. An unescaped term
 * containing those characters doesn't just break the query, it lets the
 * caller restructure the filter — so a search box becomes a way to probe
 * columns it was never meant to touch. We strip the grammar characters and
 * wrap the result in double quotes so it is always read as a single literal.
 */
function safeSearchTerm(raw: string): string {
  const cleaned = raw
    .trim()
    // Drop the PostgREST filter-grammar characters and quote/escape chars.
    .replace(/["'(),\\*]/g, ' ')
    // Collapse whitespace and control characters.
    .replace(/[\s\u0000-\u001f]+/g, ' ')
    .trim()
    .slice(0, 100);
  return cleaned;
}

function normaliseRow(row: Record<string, unknown>): RsvpWithDetails {
  const days = normaliseDays(row.days_attending as string[] | null);
  return {
    ...(row as unknown as Omit<RsvpSubmission, 'days_attending'>),
    days_attending: days,
    formatted_date: formatDate(row.created_at as string | undefined),
    days_attending_labels: formatDays(days),
  };
}

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

/**
 * Aggregate dashboard statistics across *all* responses.
 *
 * Deliberately unfiltered: these are the headline numbers the couple plans
 * catering against, so they must not silently shift when the admin narrows
 * the table below them.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServerSupabase();

  const { data: rsvps, error } = await supabase
    .from('rsvps')
    .select('guest_count, accommodation_needed, created_at, days_attending');

  if (error) throw new Error(`Failed to load dashboard stats: ${error.message}`);

  const rows = rsvps ?? [];

  const totalResponses = rows.length;
  const totalGuests = rows.reduce((sum, r) => sum + (r.guest_count ?? 0), 0);
  const accommodationNeeded = rows.filter((r) => r.accommodation_needed).length;
  const averagePartySize = totalResponses > 0 ? totalGuests / totalResponses : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentResponses = rows.filter((r) => new Date(r.created_at) >= sevenDaysAgo).length;

  // Per-day tallies in a single pass over the rows we already have, rather
  // than three extra round trips to Postgres.
  const counters = new Map<DayId, { responses: number; guests: number }>(
    DAY_IDS.map((id) => [id, { responses: 0, guests: 0 }]),
  );

  for (const row of rows) {
    const guests = row.guest_count ?? 0;
    for (const id of normaliseDays(row.days_attending)) {
      const bucket = counters.get(id);
      if (!bucket) continue;
      bucket.responses += 1;
      bucket.guests += guests;
    }
  }

  return {
    totalResponses,
    totalGuests,
    accommodationNeeded,
    averagePartySize: Math.round(averagePartySize * 10) / 10,
    recentResponses,
    perDay: DAY_IDS.map((id) => ({ id, ...counters.get(id)! })),
  };
}

/* ------------------------------------------------------------------ *
 * Listing
 * ------------------------------------------------------------------ */

/**
 * Fetch RSVP submissions with filtering, day selection and sorting all
 * applied in Postgres rather than in the browser — the admin panel stays
 * fast and correct regardless of how many responses come in.
 */
export async function getAllRsvps(filters?: RsvpFilters): Promise<RsvpWithDetails[]> {
  const supabase = getServerSupabase();

  let query = supabase.from('rsvps').select('*');

  /* Search across name / phone / email. */
  if (filters?.searchTerm?.trim()) {
    const term = safeSearchTerm(filters.searchTerm);
    if (term) {
      query = query.or(
        `name.ilike."%${term}%",phone.ilike."%${term}%",email.ilike."%${term}%"`,
      );
    }
  }

  /* Accommodation. */
  if (filters?.accommodationFilter && filters.accommodationFilter !== 'all') {
    query = query.eq('accommodation_needed', filters.accommodationFilter === 'yes');
  }

  /* Day selection, evaluated by Postgres array operators.
     'any'  → overlaps  (&&)  — attending at least one of the selected days
     'all'  → contains  (@>)  — attending every selected day */
  const days = normaliseDays(filters?.days);
  if (days.length > 0) {
    query =
      filters?.dayMatchMode === 'all'
        ? query.contains('days_attending', days)
        : query.overlaps('days_attending', days);
  }

  /* Sorting. A stable secondary key keeps pagination/ordering deterministic
     when the primary key ties. */
  switch (filters?.sortBy) {
    case 'date_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'guests_desc':
      query = query.order('guest_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'date_desc':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to load RSVPs: ${error.message}`);

  return (data ?? []).map(normaliseRow);
}

/**
 * Get single RSVP by ID. Server-side only.
 */
export async function getRsvpById(id: string): Promise<RsvpWithDetails | null> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase.from('rsvps').select('*').eq('id', id).single();

  if (error || !data) return null;

  return normaliseRow(data);
}
