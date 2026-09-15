import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, guest_count, accommodation_needed } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (typeof guest_count !== 'number' || guest_count < 1 || guest_count > 10) {
      return NextResponse.json(
        { success: false, message: 'Guest count must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (typeof accommodation_needed !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Accommodation preference is required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client (bypasses RLS)
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('rsvps')
      .insert([{
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        guest_count,
        accommodation_needed,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save RSVP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
