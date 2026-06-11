import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data: kiosks, error } = await supabaseAdmin
      .from('kiosks')
      .select('id, location_name, location_addr, is_active')
      .eq('is_active', true)
      .order('location_name');

    if (error) throw error;

    return NextResponse.json(kiosks || []);
  } catch (error: any) {
    console.error('Public Kiosks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
