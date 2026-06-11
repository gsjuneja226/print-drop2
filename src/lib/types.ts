export interface Kiosk {
  id: string;
  location_name: string;
  location_addr: string | null;
  is_active: boolean;
  is_online: boolean;
  last_ping: string | null;
  created_at: string;
}

export interface Pricing {
  id: number;
  bw_per_page: number;
  color_per_page: number;
  updated_at: string;
}

export type PrintJobStatus =
  | 'pending_payment'
  | 'paid'
  | 'printing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface PrintJob {
  id: string;
  kiosk_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  page_count: number;
  status: PrintJobStatus;
  otp: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  payment_id: string | null;
  razorpay_order_id: string | null;
  amount: number; // in rupees
  bw_price_used: number | null;
  color_price_used: number | null;
  color_mode: 'bw' | 'color';
  sides: 'single' | 'double';
  copies: number;
  orientation: 'portrait' | 'landscape';
  paper_size: 'A4' | 'A3' | 'Letter';
  page_range: string;
  selected_pages: number | null;
  physical_sheets: number | null;
  created_at: string;
  paid_at: string | null;
  printing_at: string | null;
  completed_at: string | null;
  file_deleted_at: string | null;
}

export interface AdminSession {
  token: string;
  created_at: string;
  expires_at: string;
}
