import api from './api';
import type {
  Voucher,
  VoucherUsage,
  VoucherAnalyticsResponse,
  VoucherGenerateRequest,
  VoucherValidateRequest,
  VoucherValidateResponse,
} from '../types/voucher';

export interface VoucherFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  scope?: string;
  discount_type?: string;
}

export interface VoucherUsageFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  voucher_id?: number;
  voucher_code?: string;
  start_date?: string;
  end_date?: string;
}

export const voucherService = {
  // List vouchers
  getAll: async (params?: VoucherFilterParams) => {
    const res = await api.get<{ data: Voucher[]; total: number; page: number; limit: number }>('/api/vouchers', {
      params,
    });
    return res.data;
  },

  // Get voucher by ID
  getById: async (id: number) => {
    const res = await api.get<{ data: Voucher }>(`/api/vouchers/${id}`);
    return res.data.data;
  },

  // Create single voucher
  create: async (data: Partial<Voucher>) => {
    const res = await api.post<{ message: string; data: Voucher }>('/api/vouchers', data);
    return res.data;
  },

  // Bulk generate vouchers
  generate: async (data: VoucherGenerateRequest) => {
    const res = await api.post<{ message: string; data: Voucher[]; count: number }>('/api/vouchers/generate', data);
    return res.data;
  },

  // Update voucher
  update: async (id: number, data: Partial<Voucher>) => {
    const res = await api.put<{ message: string; data: Voucher }>(`/api/vouchers/${id}`, data);
    return res.data;
  },

  // Toggle active/inactive
  toggleStatus: async (id: number) => {
    const res = await api.patch<{ message: string; data: Voucher }>(`/api/vouchers/${id}/toggle`);
    return res.data;
  },

  // Delete voucher
  delete: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/api/vouchers/${id}`);
    return res.data;
  },

  // List usages (who used which voucher)
  getUsages: async (params?: VoucherUsageFilterParams) => {
    const res = await api.get<{ data: VoucherUsage[]; total: number; page: number; limit: number }>(
      '/api/vouchers/usages',
      { params }
    );
    return res.data;
  },

  // Analytics summary and trends
  getAnalytics: async (days: number = 14) => {
    const res = await api.get<{ data: VoucherAnalyticsResponse }>('/api/vouchers/analytics', {
      params: { days },
    });
    return res.data.data;
  },

  // Validate voucher (Public or authenticated)
  validate: async (data: VoucherValidateRequest) => {
    const res = await api.post<VoucherValidateResponse>('/api/vouchers/validate', data);
    return res.data;
  },

  // Apply voucher
  apply: async (data: {
    code: string;
    amount: number;
    reference_type?: string;
    reference_no?: string;
    submission_id?: string;
    invoice_id?: number;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  }) => {
    const res = await api.post<{ message: string; data: VoucherUsage }>('/api/vouchers/apply', data);
    return res.data;
  },
};
