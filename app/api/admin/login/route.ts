import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Check if ADMIN_PASSWORD is configured
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Admin authentication is not configured' },
        { status: 500 }
      );
    }

    // Verify password against environment variable
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      // Add small delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Login attempt failed: Invalid password');
      
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create secure session cookie
    await createAdminSession();
    
    console.log('Login successful, session created');

    return NextResponse.json(
      { success: true, message: 'Authentication successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
