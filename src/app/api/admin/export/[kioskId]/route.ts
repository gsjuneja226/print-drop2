import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { kioskId: string } }) {
  try {
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { kioskId } = params;
    if (!kioskId) {
      return new NextResponse('kioskId is required', { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('kiosk_id', kioskId)
      .order('created_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Export CSV query error:', error);
      return new NextResponse('Failed to retrieve jobs for export', { status: 500 });
    }

    // Build CSV file string
    const headers = [
      'Job ID',
      'Filename',
      'Pages',
      'Color Mode',
      'Sides',
      'Copies',
      'Paper Size',
      'Orientation',
      'Page Range',
      'Amount (INR)',
      'Status',
      'Payment ID',
      'Created At',
      'Completed At'
    ];

    const rows = jobs?.map((j: any) => [
      j.id,
      `"${j.file_name.replace(/"/g, '""')}"`,
      j.page_count,
      j.color_mode,
      j.sides,
      j.copies,
      j.paper_size,
      j.orientation,
      j.page_range,
      j.amount,
      j.status,
      j.payment_id || '',
      j.created_at,
      j.completed_at || ''
    ]) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="printdrop_kiosk_${kioskId}_jobs.csv"`,
      },
    });
  } catch (error: any) {
    console.error('CSV Export API crash:', error);
    return new NextResponse(error.message || 'Internal server error', { status: 500 });
  }
}
