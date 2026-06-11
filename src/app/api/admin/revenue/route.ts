import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch kiosks
    const { data: kiosks, error: kiosksErr } = await supabaseAdmin
      .from('kiosks')
      .select('id, location_name');

    if (kiosksErr) throw kiosksErr;

    // Fetch paid jobs
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('print_jobs')
      .select('kiosk_id, amount, color_mode, created_at')
      .in('status', ['paid', 'printing', 'completed']);

    if (jobsErr) throw jobsErr;

    const now = new Date();

    // 1. Monthly cumulative logs (last 6 months)
    const monthlyDataMap = new Map<string, { month: string; revenue: number; jobsCount: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap.set(key, { month: label, revenue: 0, jobsCount: 0 });
    }

    // 2. Kiosk sales maps
    const kioskDataMap = new Map<string, number>();
    kiosks?.forEach((k: any) => kioskDataMap.set(k.id, 0));

    // 3. Color parameters maps
    let bwRevenue = 0;
    let colorRevenue = 0;
    let bwCount = 0;
    let colorCount = 0;

    jobs?.forEach((j: any) => {
      // Sort monthly
      const jobDate = new Date(j.created_at);
      const monthKey = `${jobDate.getFullYear()}-${String(jobDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap.has(monthKey)) {
        const entry = monthlyDataMap.get(monthKey)!;
        entry.revenue += j.amount;
        entry.jobsCount += 1;
      }

      // Sort by kiosk
      if (kioskDataMap.has(j.kiosk_id)) {
        kioskDataMap.set(j.kiosk_id, kioskDataMap.get(j.kiosk_id)! + j.amount);
      }

      // Sort colors
      if (j.color_mode === 'color') {
        colorRevenue += j.amount;
        colorCount += 1;
      } else {
        bwRevenue += j.amount;
        bwCount += 1;
      }
    });

    const monthlyRevenue = Array.from(monthlyDataMap.values());

    const kioskBreakdown = kiosks?.map((k: any) => ({
      name: k.location_name,
      kioskId: k.id,
      revenue: kioskDataMap.get(k.id) || 0,
    })).sort((a: any, b: any) => b.revenue - a.revenue) || [];

    const printTypeBreakdown = [
      { name: 'Black & White', value: bwRevenue, count: bwCount },
      { name: 'Color', value: colorRevenue, count: colorCount },
    ];

    const topKiosks = kioskBreakdown.slice(0, 5);

    return NextResponse.json({
      monthlyRevenue,
      kioskBreakdown,
      printTypeBreakdown,
      topKiosks,
    });
  } catch (error: any) {
    console.error('Admin Revenue API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
