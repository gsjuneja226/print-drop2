import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

/**
 * Validates the administrative session from cookies
 */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return false;

  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) return false;

  const expiresAt = new Date(data.expires_at).getTime();
  if (Date.now() > expiresAt) {
    // Delete expired session
    await supabaseAdmin.from('admin_sessions').delete().eq('token', token);
    return false;
  }

  return true;
}
