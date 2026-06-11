import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (currentPassword !== adminPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password validation successful. Please update the ADMIN_PASSWORD environment variable in your hosting provider panel (e.g. Vercel) to persist this permanently.'
    });
  } catch (error: any) {
    console.error('Change Password API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
