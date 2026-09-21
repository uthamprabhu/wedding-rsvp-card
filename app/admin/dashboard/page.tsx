import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getDashboardStats,
  getAllRsvps,
  type AccommodationFilter,
  type DayMatchMode,
  type SortBy,
} from '@/lib/admin-queries';
import { parseDayParam, type DayId } from '@/lib/wedding-days';
import DashboardClient from './DashboardClient';
import DashboardSkeleton from './DashboardSkeleton';

export const metadata = {
  title: 'Dashboard - Wedding RSVP Admin',
  robots: 'noindex, nofollow',
};

type SearchParams = { [key: string]: string | string[] | undefined };

const SORT_VALUES: SortBy[] = ['date_desc', 'date_asc', 'name_asc', 'guests_desc'];
const ACCOMMODATION_VALUES: AccommodationFilter[] = ['all', 'yes', 'no'];

interface ResolvedFilters {
  searchTerm: string;
  accommodationFilter: AccommodationFilter;
  sortBy: SortBy;
  days: DayId[];
  dayMatchMode: DayMatchMode;
}

/**
 * Every value is validated against a known allow-list before it reaches the
 * query layer. URL params are untrusted input, so an unexpected `?sort=`
 * degrades to the default rather than reaching Postgres.
 */
function resolveFilters(params: SearchParams): ResolvedFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const sortRaw = first(params.sort);
  const accRaw = first(params.accommodation);
  const matchRaw = first(params.dayMatch);

  return {
    searchTerm: typeof params.search === 'string' ? params.search : '',
    accommodationFilter: ACCOMMODATION_VALUES.includes(accRaw as AccommodationFilter)
      ? (accRaw as AccommodationFilter)
      : 'all',
    sortBy: SORT_VALUES.includes(sortRaw as SortBy) ? (sortRaw as SortBy) : 'date_desc',
    days: parseDayParam(params.days),
    dayMatchMode: matchRaw === 'all' ? 'all' : 'any',
  };
}

/**
 * Data-fetching boundary. Kept separate from the page so the auth check and
 * page shell resolve immediately while these two queries stream in behind a
 * Suspense fallback.
 */
async function DashboardData({ filters }: { filters: ResolvedFilters }) {
  const [stats, rsvps] = await Promise.all([
    getDashboardStats(),
    getAllRsvps({
      searchTerm: filters.searchTerm,
      accommodationFilter: filters.accommodationFilter,
      sortBy: filters.sortBy,
      days: filters.days,
      dayMatchMode: filters.dayMatchMode,
    }),
  ]);

  return <DashboardClient stats={stats} rsvps={rsvps} initialFilters={filters} />;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect('/admin');
  }

  const params = await searchParams;
  const filters = resolveFilters(params);

  /* Keying the boundary on the active filters means a fresh set of params
     suspends again. During client-side `startTransition` navigation React
     keeps the previous table on screen instead of flashing this fallback,
     so the skeleton only ever appears on a genuine cold load. */
  const boundaryKey = [
    filters.searchTerm,
    filters.accommodationFilter,
    filters.sortBy,
    filters.days.join('+'),
    filters.dayMatchMode,
  ].join('|');

  return (
    <Suspense key={boundaryKey} fallback={<DashboardSkeleton />}>
      <DashboardData filters={filters} />
    </Suspense>
  );
}
