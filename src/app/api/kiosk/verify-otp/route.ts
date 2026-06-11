import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { kioskId, otp } = await req.json();

    if (!kioskId || !otp) {
      return NextResponse.json({ error: 'Kiosk ID and OTP are required' }, { status: 400 });
    }

    // Check active paid jobs for this kiosk
    const { data: activeJobs, error: activeError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('kiosk_id', kioskId)
      .eq('status', 'paid');

    if (activeError || !activeJobs || activeJobs.length === 0) {
      return NextResponse.json({ error: 'No active paid jobs for this kiosk' }, { status: 404 });
    }

    // Check if any job is currently locked
    const now = Date.now();
    const lockedJob = activeJobs.find((job: any) => {
      if (job.otp_attempts >= 3 && job.payment_id?.startsWith('LOCKED_UNTIL_')) {
        const lockTime = parseInt(job.payment_id.replace('LOCKED_UNTIL_', ''), 10);
        return now < lockTime;
      }
      return false;
    });

    if (lockedJob) {
      const lockTime = parseInt(lockedJob.payment_id!.replace('LOCKED_UNTIL_', ''), 10);
      const remainingSecs = Math.ceil((lockTime - now) / 1000);
      return NextResponse.json({
        error: `Too many wrong attempts. Locked. Try again in ${remainingSecs} seconds.`,
        locked: true,
        remainingSeconds: remainingSecs
      }, { status: 423 });
    }

    // Find job that matches this OTP
    const matchingJob = activeJobs.find((job: any) => job.otp === otp);

    if (!matchingJob) {
      // Find the most recent active job to register the failed attempt
      const targetJob = activeJobs[0];
      const newAttempts = targetJob.otp_attempts + 1;
      let updateParams: any = { otp_attempts: newAttempts };

      if (newAttempts >= 3) {
        const unlockTime = Date.now() + 2 * 60 * 1000; // 2 minute lockout
        updateParams.payment_id = `LOCKED_UNTIL_${unlockTime}`;
      }

      await supabaseAdmin
        .from('print_jobs')
        .update(updateParams)
        .eq('id', targetJob.id);

      const remainingAttempts = Math.max(0, 3 - newAttempts);
      return NextResponse.json({
        error: `Incorrect code. ${remainingAttempts} attempts remaining.`,
        attemptsRemaining: remainingAttempts,
        locked: newAttempts >= 3
      }, { status: 400 });
    }

    // OTP matches! Check if expired
    const expiresAt = new Date(matchingJob.otp_expires_at || '').getTime();
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Code has expired. Contact support for a refund.' }, { status: 410 });
    }

    // Mark job as printing
    const { error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'printing',
        printing_at: new Date().toISOString(),
        otp_attempts: 0, // Reset attempts on success
      })
      .eq('id', matchingJob.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update print job' }, { status: 500 });
    }

    return NextResponse.json({
      jobId: matchingJob.id,
      fileUrl: matchingJob.file_url,
      options: {
        colorMode: matchingJob.color_mode,
        sides: matchingJob.sides,
        copies: matchingJob.copies,
        orientation: matchingJob.orientation,
        paperSize: matchingJob.paper_size,
        pageRange: matchingJob.page_range,
      }
    });
  } catch (error: any) {
    console.error('Verify OTP API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
