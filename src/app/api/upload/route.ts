import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PDFDocument } from 'pdf-lib';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kioskId = formData.get('kioskId') as string | null;

    if (!file || !kioskId) {
      return NextResponse.json({ error: 'File and kioskId are required' }, { status: 400 });
    }

    // Validate size (25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = ['pdf', 'docx', 'doc', 'jpg', 'png', 'jpeg'];
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract page count (only for PDF; others default to 1)
    let pageCount = 1;
    if (fileExt === 'pdf') {
      try {
        const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });
        pageCount = pdfDoc.getPageCount();
      } catch (err) {
        console.error('Error extracting PDF page count:', err);
        return NextResponse.json({ error: 'Failed to parse PDF file' }, { status: 400 });
      }
    }

    const jobId = crypto.randomUUID();
    const storagePath = `jobs/${jobId}/${jobId}.pdf`;

    // Ensure storage bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b: any) => b.name === 'jobs');
      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket('jobs', { public: false });
      }
    } catch (e) {
      console.warn('Error checking/creating bucket. It might already exist.', e);
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('jobs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to save file to storage' }, { status: 500 });
    }

    // Get signed URL for safety (expires in 15 mins / 900 seconds)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('jobs')
      .createSignedUrl(storagePath, 900);

    if (signError || !signedData?.signedUrl) {
      console.error('Signed URL generation error:', signError);
      return NextResponse.json({ error: 'Failed to generate file access' }, { status: 500 });
    }

    // Fetch active pricing
    let bwPrice = 2;
    let colorPrice = 8;
    const { data: pricingData } = await supabaseAdmin
      .from('pricing')
      .select('*')
      .eq('id', 1)
      .single();

    if (pricingData) {
      bwPrice = pricingData.bw_per_page;
      colorPrice = pricingData.color_per_page;
    }

    // Create print job in database
    const { error: dbError } = await supabaseAdmin
      .from('print_jobs')
      .insert({
        id: jobId,
        kiosk_id: kioskId,
        file_url: signedData.signedUrl,
        file_name: fileName,
        file_type: fileExt,
        page_count: pageCount,
        status: 'pending_payment',
        amount: pageCount * bwPrice, // Default B&W, 1 copy
        bw_price_used: bwPrice,
        color_price_used: colorPrice,
        color_mode: 'bw',
        sides: 'single',
        copies: 1,
        orientation: 'portrait',
        paper_size: 'A4',
        page_range: 'all',
        selected_pages: pageCount,
        physical_sheets: pageCount
      });

    if (dbError) {
      console.error('Database insertion error:', dbError);
      return NextResponse.json({ error: 'Failed to initialize print job' }, { status: 500 });
    }

    return NextResponse.json({
      jobId,
      fileUrl: signedData.signedUrl,
      pageCount,
      fileName
    });
  } catch (error: any) {
    console.error('Upload API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
