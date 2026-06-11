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
      .select('*')
      .order('created_at', { ascending: false });

    if (kiosksErr) throw kiosksErr;

    // Fetch print jobs to calculate stats in-memory
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('print_jobs')
      .select('kiosk_id, amount, status, created_at');

    if (jobsErr) throw jobsErr;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const statsMap = new Map<string, {
      totalJobs: number;
      totalRevenue: number;
      todayJobs: number;
      todayRevenue: number;
    }>();

    // Initialize maps for all kiosks
    kiosks?.forEach((k: any) => {
      statsMap.set(k.id, { totalJobs: 0, totalRevenue: 0, todayJobs: 0, todayRevenue: 0 });
    });

    jobs?.forEach((j: any) => {
      if (!statsMap.has(j.kiosk_id)) return;
      const stats = statsMap.get(j.kiosk_id)!;

      const isPaidOrCompleted = ['paid', 'printing', 'completed'].includes(j.status);
      
      if (isPaidOrCompleted) {
        stats.totalRevenue += j.amount;
        if (j.created_at >= startOfToday) {
          stats.todayRevenue += j.amount;
        }
      }

      if (j.status === 'completed') {
        stats.totalJobs += 1;
        if (j.created_at >= startOfToday) {
          stats.todayJobs += 1;
        }
      }
    });

    const kiosksWithStats = kiosks?.map((k: any) => {
      const stats = statsMap.get(k.id) || { totalJobs: 0, totalRevenue: 0, todayJobs: 0, todayRevenue: 0 };
      
      // Calculate connection status
      let status = 'offline';
      if (k.is_active) {
        if (k.last_ping) {
          const lastPing = new Date(k.last_ping).getTime();
          const diffMins = (Date.now() - lastPing) / 1000 / 60;
          if (diffMins < 2) {
            status = 'online';
          } else if (diffMins < 10) {
            status = 'idle';
          }
        }
      } else {
        status = 'inactive';
      }

      return {
        ...k,
        status,
        ...stats,
      };
    });

    return NextResponse.json(kiosksWithStats || []);
  } catch (error: any) {
    console.error('Get Kiosks Admin API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, location_name, location_addr } = await req.json();

    if (!id || !location_name) {
      return NextResponse.json({ error: 'Kiosk ID and Location Name are required' }, { status: 400 });
    }

    // Insert new kiosk record
    const { data, error } = await supabaseAdmin
      .from('kiosks')
      .insert({
        id,
        location_name,
        location_addr: location_addr || '',
        is_active: true,
        is_online: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Kiosk creation error:', error);
      return NextResponse.json({ error: 'Failed to create kiosk (ID may already exist)' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Create Kiosk Admin API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
