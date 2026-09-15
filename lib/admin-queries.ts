import { getServerSupabase, RsvpSubmission } from './supabase';

export interface DashboardStats {
  totalResponses: number;
  totalGuests: number;
  accommodationNeeded: number;
  averagePartySize: number;
  recentResponses: number; // Last 7 days
}

export interface RsvpWithDetails extends RsvpSubmission {
  formatted_date: string;
}

/**
 * Get dashboard statistics
 * Server-side only - uses service_role key
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServerSupabase();
  
  // Get all RSVPs for aggregation
  const { data: rsvps, error } = await supabase
    .from('rsvps')
    .select('guest_count, accommodation_needed, created_at');
  
  if (error) throw error;
  
  const totalResponses = rsvps?.length || 0;
  const totalGuests = rsvps?.reduce((sum, r) => sum + r.guest_count, 0) || 0;
  const accommodationNeeded = rsvps?.filter(r => r.accommodation_needed).length || 0;
  const averagePartySize = totalResponses > 0 ? totalGuests / totalResponses : 0;
  
  // Count responses in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentResponses = rsvps?.filter(r => 
    new Date(r.created_at) >= sevenDaysAgo
  ).length || 0;
  
  return {
    totalResponses,
    totalGuests,
    accommodationNeeded,
    averagePartySize: Math.round(averagePartySize * 10) / 10,
    recentResponses,
  };
}

/**
 * Get all RSVP submissions with optional filtering
 * Server-side only - uses service_role key
 */
export async function getAllRsvps(filters?: {
  searchTerm?: string;
  accommodationFilter?: 'all' | 'yes' | 'no';
  sortBy?: 'date_desc' | 'date_asc' | 'name_asc' | 'guests_desc';
}): Promise<RsvpWithDetails[]> {
  const supabase = getServerSupabase();
  
  let query = supabase
    .from('rsvps')
    .select('*');
  
  // Apply search filter (name, phone, email)
  if (filters?.searchTerm && filters.searchTerm.trim()) {
    const term = filters.searchTerm.trim();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }
  
  // Apply accommodation filter
  if (filters?.accommodationFilter && filters.accommodationFilter !== 'all') {
    query = query.eq('accommodation_needed', filters.accommodationFilter === 'yes');
  }
  
  // Apply sorting
  switch (filters?.sortBy) {
    case 'date_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'guests_desc':
      query = query.order('guest_count', { ascending: false });
      break;
    case 'date_desc':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Format dates for display
  return (data || []).map(rsvp => ({
    ...rsvp,
    formatted_date: new Date(rsvp.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
}

/**
 * Get single RSVP by ID
 * Server-side only
 */
export async function getRsvpById(id: string): Promise<RsvpWithDetails | null> {
  const supabase = getServerSupabase();
  
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  
  return {
    ...data,
    formatted_date: new Date(data.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
