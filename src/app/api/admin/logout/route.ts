import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (token) {
      // Delete token from database to prevent replay
      await supabaseAdmin.from('admin_sessions').delete().eq('token', token);
    }

    const response = NextResponse.json({ success: true });
    
    // Clear admin cookie
    response.cookies.delete('admin_session');
    
    return response;
  } catch (error: any) {
    console.error('Admin Logout API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
