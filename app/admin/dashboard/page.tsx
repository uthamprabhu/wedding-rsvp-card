import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getDashboardStats, getAllRsvps } from '@/lib/admin-queries';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard - Wedding RSVP Admin',
  robots: 'noindex, nofollow',
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Check authentication
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect('/admin');
  }

  // Get search/filter params
  const params = await searchParams;
  const searchTerm = typeof params.search === 'string' ? params.search : undefined;
  const accommodationFilter = 
    typeof params.accommodation === 'string' && 
    ['all', 'yes', 'no'].includes(params.accommodation)
      ? (params.accommodation as 'all' | 'yes' | 'no')
      : 'all';
  const sortBy = 
    typeof params.sort === 'string' && 
    ['date_desc', 'date_asc', 'name_asc', 'guests_desc'].includes(params.sort)
      ? (params.sort as 'date_desc' | 'date_asc' | 'name_asc' | 'guests_desc')
      : 'date_desc';

  // Fetch data server-side
  const [stats, rsvps] = await Promise.all([
    getDashboardStats(),
    getAllRsvps({ searchTerm, accommodationFilter, sortBy }),
  ]);

  return (
    <DashboardClient
      stats={stats}
      rsvps={rsvps}
      initialFilters={{
        searchTerm: searchTerm || '',
        accommodationFilter,
        sortBy,
      }}
    />
  );
}
