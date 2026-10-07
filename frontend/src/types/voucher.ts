export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type VoucherScope = 'ALL' | 'REGULER' | 'SELF_DECLARE' | 'TRAINING' | 'TELEMARKETING';

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number;
  min_spend?: number;
  usage_limit: number;
  usage_per_user: number;
  used_count: number;
  total_discount: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  scope: VoucherScope;
  created_by_id?: string;
  created_by?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VoucherUsage {
  id: number;
  voucher_id: number;
  voucher?: Voucher;
  voucher_code: string;
  user_id?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  user_name: string;
  user_email: string;
  user_phone: string;
  submission_id?: string;
  invoice_id?: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  reference_type: string;
  reference_no: string;
  status: string;
  used_at: string;
  created_at: string;
}

export interface VoucherAnalyticsSummary {
  total_vouchers: number;
  active_vouchers: number;
  expired_vouchers: number;
  total_claims: number;
  total_discount_amount: number;
  total_gross_volume: number;
  avg_discount_per_claim: number;
  total_unique_users: number;
}

export interface VoucherDailyTrend {
  date: string;
  claim_count: number;
  total_discount: number;
  total_volume: number;
}

export interface TopVoucherStat {
  voucher_id: number;
  code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  used_count: number;
  total_discount: number;
}

export interface VoucherAnalyticsResponse {
  summary: VoucherAnalyticsSummary;
  daily_trend: VoucherDailyTrend[];
  top_vouchers: TopVoucherStat[];
  scope_breakdown: Record<string, number>;
}

export interface VoucherGenerateRequest {
  prefix?: string;
  suffix?: string;
  length: number;
  count: number;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number;
  min_spend?: number;
  usage_limit: number;
  usage_per_user: number;
  valid_from: string;
  valid_until: string;
  scope: VoucherScope;
}

export interface VoucherValidateRequest {
  code: string;
  amount: number;
  user_id?: string;
  service_type?: string;
  submission_id?: string;
}

export interface VoucherValidateResponse {
  valid: boolean;
  message: string;
  voucher?: Voucher;
  discount_amount: number;
  final_amount: number;
}
