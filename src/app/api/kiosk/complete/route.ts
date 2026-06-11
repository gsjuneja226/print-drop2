import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Get job details to verify it exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
    }

    // Update print job status to completed
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Database update error during completion:', updateError);
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    // Delete file from Supabase storage
    const storagePath = `jobs/${jobId}/${jobId}.pdf`;
    const { error: deleteError } = await supabaseAdmin.storage
      .from('jobs')
      .remove([storagePath]);

    if (deleteError) {
      console.error('Storage deletion error:', deleteError);
    } else {
      await supabaseAdmin
        .from('print_jobs')
        .update({ file_deleted_at: now })
        .eq('id', jobId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Kiosk Complete API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
