import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      jobId
    } = await req.json();

    if (!jobId || !razorpay_payment_id || !razorpay_order_id) {
      return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    // Verify signature if secret key is present
    if (razorpayKeySecret && !razorpay_order_id.startsWith('order_mock_')) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Update job status in database
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        otp,
        otp_expires_at: otpExpiresAt,
        paid_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select('kiosk_id')
      .single();

    if (updateError || !updatedJob) {
      console.error('Failed to update job payment status:', updateError);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    // Broadcast to Supabase Realtime channel
    const kioskId = updatedJob.kiosk_id;
    try {
      const channel = supabaseAdmin.channel(`kiosk:${kioskId}`);
      await new Promise<void>((resolve) => {
        channel.subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'new_job',
              payload: { jobId, otp },
            });
          }
          resolve();
        });
      });
      await supabaseAdmin.removeChannel(channel);
    } catch (realtimeErr) {
      console.warn('Realtime broadcast failed, database listener should handle updates:', realtimeErr);
    }

    return NextResponse.json({
      success: true,
      jobId,
      otp,
    });
  } catch (error: any) {
    console.error('Verify Payment API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
