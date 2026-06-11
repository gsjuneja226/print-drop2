import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { kioskId, jobId } = await req.json();

    if (!kioskId || !jobId) {
      return NextResponse.json({ error: 'Kiosk ID and Job ID are required' }, { status: 400 });
    }

    // Get the job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('kiosk_id', kioskId)
      .eq('status', 'paid')
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Active paid job not found' }, { status: 404 });
    }

    // Mark job as printing
    const { error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'printing',
        printing_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update print job' }, { status: 500 });
    }

    // Regenerate a fresh signed URL to prevent expiration issues on long wait times
    const storagePath = `jobs/${job.id}/${job.id}.pdf`;
    let freshFileUrl = job.file_url;
    try {
      const { data: signedData, error: signError } = await supabaseAdmin.storage
        .from('jobs')
        .createSignedUrl(storagePath, 900);
      if (!signError && signedData?.signedUrl) {
        freshFileUrl = signedData.signedUrl;
      }
    } catch (storageErr) {
      console.warn('Failed to regenerate signed URL, using stored URL:', storageErr);
    }

    return NextResponse.json({
      jobId: job.id,
      fileName: job.file_name, // Return original file name
      fileUrl: freshFileUrl,
      options: {
        colorMode: job.color_mode,
        sides: job.sides,
        copies: job.copies,
        orientation: job.orientation,
        paperSize: job.paper_size,
        pageRange: job.page_range,
      }
    });
  } catch (error: any) {
    console.error('Start Print API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
