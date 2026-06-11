import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { kioskId: string } }) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kioskId } = params;
    const { location_name, location_addr, is_active } = await req.json();

    if (!kioskId) {
      return NextResponse.json({ error: 'kioskId is required' }, { status: 400 });
    }

    // Compile dynamic update values
    const updateData: any = {};
    if (location_name !== undefined) updateData.location_name = location_name;
    if (location_addr !== undefined) updateData.location_addr = location_addr;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('kiosks')
      .update(updateData)
      .eq('id', kioskId)
      .select('*')
      .single();

    if (error) {
      console.error('Kiosk patch error:', error);
      return NextResponse.json({ error: 'Failed to update kiosk' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Kiosk patch API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
