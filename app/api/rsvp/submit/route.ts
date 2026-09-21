import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ *
 * Schema — Zod v4
 * ------------------------------------------------------------------ */
const schema = z.object({
  name: z
    .string()
    .min(2, 'Please enter your full name.')
    .max(100, 'Name is too long.')
    .transform((v) => v.trim()),

  phone: z
    .string()
    .min(7, 'Please enter a valid phone number.')
    .max(20, 'Phone number is too long.')
    // strip spaces, dashes, brackets so "+91 9633-693160" normalises to "+919633693160"
    .transform((v) => v.replace(/[\s\-().]/g, ''))
    .refine((v) => /^\+?\d{7,15}$/.test(v), {
      message: 'Please enter a valid phone number (digits only, optionally starting with +).',
    }),

  email: z
    .string()
    .email('Please enter a valid email address.')
    .max(200)
    .transform((v) => v.trim().toLowerCase())
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((v) => (v && v.length > 0 ? v : null)),

  guest_count: z
    .number({ error: 'Guest count must be a number.' })
    .int()
    .min(1, 'At least 1 guest is required.')
    .max(10, 'Maximum 10 guests per RSVP.'),

  accommodation_needed: z.boolean({
    error: 'Please let us know about accommodation.',
  }),

  days_attending: z
    .array(z.enum(['day1', 'day2', 'day3']))
    .min(1, 'Please select at least one day you plan to attend.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    /* -------- Zod validation -------- */
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Invalid submission. Please check your details.';
      return NextResponse.json(
        { success: false, message: first, code: 'validation_error' },
        { status: 400 },
      );
    }

    const { name, phone, email, guest_count, accommodation_needed, days_attending } = parsed.data;

    const supabase = getServerSupabase();

    /* -------- Duplicate-phone check -------- */
    const { data: existing } = await supabase
      .from('rsvps')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: 'duplicate_phone',
          message:
            'It looks like you have already submitted your RSVP with this number. If you need to make a change, please reach out to us directly.',
        },
        { status: 409 },
      );
    }

    /* -------- Insert -------- */
    const { data, error } = await supabase
      .from('rsvps')
      .insert([{ name, phone, email, guest_count, accommodation_needed, days_attending }])
      .select()
      .single();

    if (error) {
      // Catch the DB-level unique constraint as a safety net in case of a race
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            code: 'duplicate_phone',
            message:
              'It looks like you have already submitted your RSVP with this number. If you need to make a change, please reach out to us directly.',
          },
          { status: 409 },
        );
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save your RSVP. Please try again.', code: 'server_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.', code: 'server_error' },
      { status: 500 },
    );
  }
}
