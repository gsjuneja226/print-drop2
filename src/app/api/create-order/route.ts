import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parsePageRange } from '@/lib/utils';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const {
      jobId,
      colorMode,
      sides,
      copies,
      paperSize,
      orientation,
      pageRange
    } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
    }

    // Get active pricing
    let bwPrice = 2;
    let colorPrice = 8;
    const { data: pricing } = await supabaseAdmin
      .from('pricing')
      .select('*')
      .eq('id', 1)
      .single();

    if (pricing) {
      bwPrice = pricing.bw_per_page;
      colorPrice = pricing.color_per_page;
    }

    // Recalculate pages and amount
    const selectedPages = parsePageRange(pageRange, job.page_count);
    const physicalPages = sides === 'double' ? Math.ceil(selectedPages / 2) : selectedPages;
    const totalPrintedPages = physicalPages * Number(copies);
    const pricePerPage = colorMode === 'color' ? colorPrice : bwPrice;
    const totalAmount = totalPrintedPages * pricePerPage;

    // Razorpay checkout works in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    let razorpayOrderId = '';

    const isPlaceholder = (key: string) =>
      !key ||
      key.trim() === '' ||
      key.includes('your_') ||
      key.includes('placeholder');

    if (!isPlaceholder(razorpayKeyId) && !isPlaceholder(razorpayKeySecret)) {
      try {
        const razorpay = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: jobId,
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.error('Razorpay SDK order creation failed:', err);
        return NextResponse.json({ error: 'Razorpay order creation failed: ' + err.message }, { status: 500 });
      }
    } else {
      console.warn('Razorpay keys missing in environment. Using mock order ID.');
      razorpayOrderId = 'order_mock_' + crypto.randomUUID().split('-')[0];
    }

    // Update job status and configuration in Database
    const { error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        color_mode: colorMode,
        sides: sides,
        copies: Number(copies),
        paper_size: paperSize,
        orientation: orientation,
        page_range: pageRange,
        selected_pages: selectedPages,
        physical_sheets: physicalPages,
        amount: totalAmount,
        bw_price_used: bwPrice,
        color_price_used: colorPrice,
        razorpay_order_id: razorpayOrderId,
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Job configuration update error:', updateError);
      return NextResponse.json({ error: 'Failed to update job details' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: razorpayOrderId,
      amount: amountInPaise,
      keyId: razorpayKeyId || 'rzp_test_placeholder',
    });
  } catch (error: any) {
    console.error('Create Order API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
