import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Validate CRON_SECRET header or query parameter if set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      const searchParamsSecret = new URL(req.url).searchParams.get('secret');
      
      const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
      const isParamValid = searchParamsSecret === cronSecret;

      if (!isHeaderValid && !isParamValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date().toISOString();

    // 1. Expire paid print jobs where the OTP window is elapsed
    const { data: expiredPaidJobs, error: expireErr } = await supabaseAdmin
      .from('print_jobs')
      .update({ status: 'expired' })
      .eq('status', 'paid')
      .lt('otp_expires_at', now)
      .select('id');

    if (expireErr) {
      console.error('Error expiring jobs:', expireErr);
    }

    // 2. Fetch completed/expired/failed jobs that still hold documents in storage
    const { data: jobsToCleanup, error: cleanupErr } = await supabaseAdmin
      .from('print_jobs')
      .select('id, file_deleted_at')
      .in('status', ['completed', 'expired', 'failed'])
      .is('file_deleted_at', null);

    if (cleanupErr) {
      console.error('Error fetching jobs for cleanup:', cleanupErr);
      return NextResponse.json({ error: 'Failed to retrieve jobs for cleanup' }, { status: 500 });
    }

    // 3. Include pending jobs older than 2 hours to prevent disk bloat
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: abandonedJobs } = await supabaseAdmin
      .from('print_jobs')
      .select('id')
      .eq('status', 'pending_payment')
      .lt('created_at', twoHoursAgo)
      .is('file_deleted_at', null);

    const allJobsToPurge = [
      ...(jobsToCleanup || []),
      ...(abandonedJobs || []).map((j: any) => ({ ...j, isAbandoned: true }))
    ];

    const deletedJobIds: string[] = [];

    for (const job of allJobsToPurge) {
      const storagePath = `jobs/${job.id}/${job.id}.pdf`;
      const { error: removeErr } = await supabaseAdmin.storage
        .from('jobs')
        .remove([storagePath]);

      if (!removeErr) {
        const updateParams: any = { file_deleted_at: now };
        if ((job as any).isAbandoned) {
          updateParams.status = 'expired';
        }
        await supabaseAdmin
          .from('print_jobs')
          .update(updateParams)
          .eq('id', job.id);
          
        deletedJobIds.push(job.id);
      } else {
        console.error(`Failed to delete file for job ${job.id}:`, removeErr);
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredPaidJobs?.length || 0,
      filesCleanedCount: deletedJobIds.length,
      cleanedJobIds: deletedJobIds,
    });
  } catch (error: any) {
    console.error('Cron Cleanup API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
