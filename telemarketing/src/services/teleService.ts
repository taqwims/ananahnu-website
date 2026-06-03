import api from './api';

// ── Types ──────────────────────────────────────────────────────────

export interface TeleForm {
  id: string;
  name: string;
  phone: string;
  email: string;
  business_type: string;
  business_scale: string;
  uses_meat: boolean;
  province_id: number;
  province?: { id: number; name: string };
  is_catering: boolean;
  is_amdk: boolean;
  agreed_terms: boolean;
  route_type: string;
  status: string;
  telemarketer_id?: string;
  telemarketer?: { id: string; full_name: string };
  client_user_id?: string;
  shared_by_id?: string;
  shared_by?: { id: string; full_name: string };
  submission_id?: string;
  ip_address: string;
  created_at: string;
  updated_at: string;
}

export interface TeleMeeting {
  id: string;
  tele_form_id: string;
  tele_form?: TeleForm;
  telemarketer_id: string;
  telemarketer?: { id: string; full_name: string };
  scheduled_at: string;
  duration: number;
  meeting_type: string;
  meeting_link: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TeleAgreement {
  id: string;
  tele_form_id: string;
  agreement_number: string;
  client_user_id: string;
  business_name: string;
  pic_name: string;
  address: string;
  email: string;
  phone: string;
  service_value: number;
  dp_percent: number;
  data_accuracy_consent: boolean;
  agreement_consent: boolean;
  regulator_consent: boolean;
  ip_address: string;
  signed_at: string;
  pdf_url: string;
  created_at: string;
}

export interface TeleAnalytics {
  total_forms: number;
  total_teleconference: number;
  total_self_declare: number;
  total_account_created: number;
  total_agreement_signed: number;
  total_invoice_sent: number;
  total_paid: number;
  total_expired: number;
  conversion_rate: number;
  funnel_data: { step: string; count: number }[];
  monthly_trend: { month: string; forms_received: number; accounts_created: number; paid: number }[];
}

export interface TeleDashboard {
  total_assigned: number;
  pending_forms: number;
  scheduled_meetings: number;
  active_clients: number;
  today_meetings: TeleMeeting[];
  recent_forms: TeleForm[];
  status_counts: Record<string, number>;
}

export interface Province {
  id: number;
  name: string;
}

// ── API Calls ──────────────────────────────────────────────────────

// Public
export const submitPublicForm = (data: Record<string, unknown>) =>
  api.post('/tele/form', data);

export const getFormStatus = (id: string) =>
  api.get<TeleForm>(`/tele/form/${id}`);

// Forms (auth required)
export const getAllForms = (params?: Record<string, string | number>) =>
  api.get<{ data: TeleForm[]; total: number }>('/tele/forms', { params });

export const getMyForms = (params?: Record<string, string | number>) =>
  api.get<{ data: TeleForm[]; total: number }>('/tele/forms/my', { params });

export const updateFormStatus = (id: string, status: string) =>
  api.put(`/tele/forms/${id}/status`, { status });

// Meetings
export const scheduleMeeting = (data: Record<string, unknown>) =>
  api.post<TeleMeeting>('/tele/meetings', data);

export const getAllMeetings = (params?: Record<string, string | number>) =>
  api.get<{ data: TeleMeeting[]; total: number }>('/tele/meetings', { params });

export const getMyMeetings = (params?: Record<string, string | number>) =>
  api.get<{ data: TeleMeeting[]; total: number }>('/tele/meetings/my', { params });

export const updateMeeting = (id: string, data: Record<string, unknown>) =>
  api.put(`/tele/meetings/${id}`, data);

// Account
export const generateClientAccount = (formId: string) =>
  api.post<{ email: string; password: string; user_id: string }>(`/tele/generate-account/${formId}`);

// Agreement
export const createAgreement = (data: Record<string, unknown>) =>
  api.post<TeleAgreement>('/tele/agreement', data);

export const getAgreementByFormId = (formId: string) =>
  api.get<TeleAgreement>(`/tele/agreement/${formId}`);

// Analytics & Dashboard
export const getAnalytics = (params?: Record<string, string>) =>
  api.get<TeleAnalytics>('/tele/analytics', { params });

export const getDashboard = () =>
  api.get<TeleDashboard>('/tele/dashboard');

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// Geography (reuse from existing backend)
export const getProvinces = () =>
  api.get<Province[]>('/geography/provinces');
