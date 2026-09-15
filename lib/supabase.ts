import { createClient } from '@supabase/supabase-js';

// Client-side Supabase (public key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (for admin panel)
export const getServerSupabase = () => {
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SECRET_KEY not configured');
  }
  return createClient(supabaseUrl, serviceKey);
};

export interface RsvpSubmission {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  guest_count: number;
  accommodation_needed: boolean;
  created_at?: string;
}

export async function submitRsvp(data: {
  name: string;
  phone: string;
  email?: string;
  guest_count: number;
  accommodation_needed: boolean;
}) {
  // Validate data
  if (!data.name?.trim()) {
    throw new Error('Name is required');
  }
  if (!data.phone?.trim()) {
    throw new Error('Phone is required');
  }
  if (data.guest_count < 1 || data.guest_count > 10) {
    throw new Error('Guest count must be between 1 and 10');
  }

  const { data: result, error } = await supabase
    .from('rsvps')
    .insert([{
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      guest_count: data.guest_count,
      accommodation_needed: data.accommodation_needed,
    }])
    .select()
    .single();

  if (error) throw error;
  return result;
}

