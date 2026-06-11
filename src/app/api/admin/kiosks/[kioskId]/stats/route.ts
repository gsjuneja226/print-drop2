import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { kioskId: string } }) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kioskId } = params;
    if (!kioskId) {
      return NextResponse.json({ error: 'kioskId is required' }, { status: 400 });
    }

    // Fetch kiosk info
    const { data: kiosk, error: kioskErr } = await supabaseAdmin
      .from('kiosks')
      .select('*')
      .eq('id', kioskId)
      .single();

    if (kioskErr || !kiosk) {
      return NextResponse.json({ error: 'Kiosk not found' }, { status: 404 });
    }

    // Fetch all jobs for this kiosk
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('kiosk_id', kioskId);

    if (jobsErr) throw jobsErr;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOf14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    let revenueToday = 0;
    let revenueThisMonth = 0;
    let printsToday = 0;
    let allTimePrints = 0;

    let bwCount = 0;
    let colorCount = 0;

    // Heatmap data: 7 days x 24 hours grid
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    // Daily chart mappings
    const dailyDataMap = new Map<string, { date: string; rawDate: string; jobs: number; revenue: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const isoKey = d.toISOString().split('T')[0];
      dailyDataMap.set(isoKey, { date: dateStr, rawDate: isoKey, jobs: 0, revenue: 0 });
    }

    jobs?.forEach((j: any) => {
      const isPaidOrCompleted = ['paid', 'printing', 'completed'].includes(j.status);
      const isCompleted = j.status === 'completed';

      // Aggregate revenue & printing statistics
      if (isPaidOrCompleted) {
        if (j.created_at >= startOfToday) {
          revenueToday += j.amount;
        }
        if (j.created_at >= startOfMonth) {
          revenueThisMonth += j.amount;
        }
      }

      if (isCompleted) {
        allTimePrints++;
        if (j.created_at >= startOfToday) {
          printsToday++;
        }
      }

      // Aggregate printing colors ratios
      if (isPaidOrCompleted) {
        if (j.color_mode === 'color') {
          colorCount++;
        } else {
          bwCount++;
        }
      }

      // Populate peak printing times heatmap
      if (isPaidOrCompleted) {
        const jobDate = new Date(j.created_at);
        const day = jobDate.getDay(); // 0-6
        const hour = jobDate.getHours(); // 0-23
        heatmap[day][hour]++;
      }

      // Populate daily chronological values
      const isoKey = j.created_at.split('T')[0];
      if (dailyDataMap.has(isoKey) && isPaidOrCompleted) {
        const entry = dailyDataMap.get(isoKey)!;
        entry.revenue += j.amount;
        if (isCompleted) {
          entry.jobs += 1;
        }
      }
    });

    const dailyChartData = Array.from(dailyDataMap.values());

    return NextResponse.json({
      kiosk,
      stats: {
        revenueToday,
        revenueThisMonth,
        printsToday,
        allTimePrints,
      },
      colorBreakdown: [
        { name: 'Black & White', value: bwCount },
        { name: 'Color', value: colorCount },
      ],
      dailyChartData,
      heatmap,
    });
  } catch (error: any) {
    console.error('Kiosk Stats API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
