export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    leader_id?: string;
}

export interface Client {
    id: string;
    nib: string;
    business_name: string;
    address: string;
    product_name: string;
    service_type: string;
    phone: string;
}

export type SubmissionStatus = 'DRAFT' | 'WAITING_PAYMENT' | 'VERVAL_PENDAMPING' | 'QC_OFFICER' | 'DRAFTER' | 'SIDANG_FATWA' | 'SH_TERBIT' | 'REJECTED' | 'REVISION';

export interface Payment {
    id: number;
    submission_id: string;
    amount: number;
    method: 'MANUAL' | 'MIDTRANS';
    status: 'PENDING' | 'PAID' | 'FAILED';
    proof_url?: string;
    external_id?: string;
    snap_token?: string;
    snap_url?: string;
    midtrans_id?: string;
    payment_type?: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Submission {
    id: string;
    client_id: string;
    client?: Client;
    status: SubmissionStatus;
    service_type: string;
    current_assignee_role: number;
    regency_id?: number;
    district_id?: number;
    payments?: Payment[];
    field_values?: FormFieldValue[];
    created_at: string;
    updated_at: string;
}

export interface News {
    id: number;
    title: string;
    content: string;
    category: string;
    author: string;
    created_at: string;
}

export interface ContentBlock {
    id: number;
    key: string;
    section: string;
    content: string;
}

// --- Dynamic Form Config ---

export interface FormFieldConfig {
    id: number;
    form_type: string;
    field_key: string;
    field_label: string;
    input_type: 'FILE_UPLOAD' | 'LINK' | 'TEXT';
    is_required: boolean;
    sort_order: number;
    description: string;
}

export interface FormFieldValue {
    id: number;
    submission_id: string;
    form_field_id: number;
    form_field: FormFieldConfig;
    text_value?: string;
    file_url?: string;
    link_value?: string;
}

// --- Training ---

export interface Training {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    participants?: TrainingParticipant[];
    created_at: string;
}

export interface TrainingParticipant {
    id: number;
    training_id: number;
    user_id: string;
    user?: User;
    status: 'PESERTA' | 'LULUS';
}

// --- Consultant Recruitment ---

export interface ConsultantProfile {
    id: string;
    user_id: string;
    user?: User;
    ktp_url: string;
    photo_3x4_url: string;
    ijazah_sta_url: string;
    bank_account_url: string;
    npwp_url?: string;
    is_verified: boolean;
    created_at: string;
}

// --- Invoice / Billing ---

export interface Invoice {
    id: number;
    submission_id: string;
    submission?: Submission;
    service_type: string;
    amount: number;
    status: 'UNPAID' | 'PAID';
    regency_id?: number;
    district_id?: number;
    notes: string;
    created_at: string;
    paid_at?: string;
}

export interface PaymentConfigItem {
    id: number;
    service_type: string;
    item_name: string;
    amount: number;
    is_active: boolean;
}

// --- Geography ---

export interface Province {
    id: number;
    name: string;
}

export interface Regency {
    id: number;
    province_id: number;
    province?: Province;
    name: string;
}

export interface District {
    id: number;
    regency_id: number;
    regency?: Regency;
    name: string;
}

export interface BillingRate {
    id: number;
    service_type: string;
    regency_id: number;
    regency?: Regency;
    district_id?: number;
    amount: number;
    description: string;
}

