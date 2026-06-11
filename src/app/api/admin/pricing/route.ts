import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bw_per_page, color_per_page } = await req.json();

    if (bw_per_page === undefined && color_per_page === undefined) {
      return NextResponse.json({ error: 'At least one pricing field is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (bw_per_page !== undefined) updateData.bw_per_page = Number(bw_per_page);
    if (color_per_page !== undefined) updateData.color_per_page = Number(color_per_page);

    const { data, error } = await supabaseAdmin
      .from('pricing')
      .update(updateData)
      .eq('id', 1)
      .select('*')
      .single();

    if (error) {
      console.error('Pricing update error:', error);
      return NextResponse.json({ error: 'Failed to update pricing configuration' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Pricing Update API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
