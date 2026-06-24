export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    address?: string;
    role: string;
    role_id?: number;
    leader_id?: string;
    leader?: User;
    referral_code?: string;
    province_id?: number;
    regency_id?: number;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Role {
    id: number;
    name: string;
}

export interface BusinessType {
    id: number;
    name: string;
    description?: string;
}

export interface Client {
    id: string;
    nib: string;
    nik: string;
    business_name: string;
    client_name: string;
    address: string;
    product_name: string;
    service_type: string;
    self_declare_type?: string;
    facilitator_id: string;
    facilitator?: User;
    contact_person?: string;
    phone: string;
    created_by: string;
    created_at?: string;
    updated_at?: string;
}

export type SubmissionStatus = 'DRAFT' | 'WAITING_PAYMENT' | 'VERVAL_PENDAMPING' | 'QC_OFFICER' | 'DRAFTER' | 'QC_REVIEW' | 'SIDANG_FATWA' | 'SH_TERBIT' | 'REJECTED' | 'REVISION';

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
    invoices?: Invoice[];
    created_at: string;
    updated_at: string;
}

export interface Submission {
    id: string;
    client_id: string;
    client?: Client;
    status: SubmissionStatus;
    service_type: string;
    self_declare_type?: string;
    current_assignee_role: number;
    sales_scheme_id?: number;
    consultant_id?: string;
    consultant?: User;
    assigned_drafter_id?: string;
    assigned_drafter?: User;
    data_source?: string;
    regency_id?: number;
    district_id?: number;
    payments?: Payment[];
    invoice?: Invoice;    // legacy: first invoice only
    invoices?: Invoice[]; // all invoices (DP + PELUNASAN)
    field_values?: FormFieldValue[];
    cost_detail?: SubmissionCostDetail;
    sh_url?: string;
    tracking_number?: string;
    audit_date?: string;
    audit_result_1_url?: string;
    audit_result_2_url?: string;
    reject_note?: string;
    business_type_id?: number;
    business_type?: BusinessType;
    province_id?: number;
    product_category_id?: number;
    business_scale_id?: number;
    product_count?: number;
    branch_count?: number;
    mandays?: number;
    bpjph_payment_status?: 'UNPAID' | 'PAID';
    bpjph_amount?: number;
    bpjph_paid_at?: string;
    created_at: string;
    updated_at: string;
}

// --- CMS --- (Fixed to match backend domain)

export interface News {
    id: number;
    title: string;
    slug: string;
    content: string;
    thumbnail_url: string;
    published_at: string;
    tags: string;
}

export interface ContentBlock {
    id: number;
    section_key: string;
    title: string;
    body: string;
    image_url: string;
}

export interface Affiliate {
    id: number;
    name: string;
    logo_url: string;
    website_url: string;
}

export interface CertifiedProduct {
    id: number;
    name: string;
    company_name: string;
    certificate_number: string;
    valid_until: string;
    photo_url: string;
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
    business_type_id?: number;
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
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    proposed_by?: string;
    proposer?: User;
    rejected_reason?: string;
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
    payer?: User;
    service_type: string;
    type: 'DP' | 'PELUNASAN' | 'FULL'; // DP=70% awal, PELUNASAN=30% sebelum download SH
    amount: number;
    status: 'UNPAID' | 'PAID';
    regency_id?: number;
    district_id?: number;
    pricing_source?: string;
    sales_scheme_id?: number;
    discount_applied?: number;
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
export interface AuditLog {
    id: number;
    user_id: string;
    user?: User;
    action: string;
    entity_type: string;
    entity_id: string;
    notes: string;
    created_at: string;
}

export interface BusinessScale {
    id: number;
    name: string;
}

export interface ProductCategory {
    id: number;
    name: string;
}

export interface SalesScheme {
    id: number;
    name: string;
}

export interface SubmissionCostDetail {
    id: number;
    submission_id: string;
    product_category_id?: number;
    product_category?: ProductCategory;
    business_scale_id?: number;
    business_scale?: BusinessScale;
    province_id?: number;
    province?: Province;
    regency_id?: number;
    regency?: Regency;
    district_id?: number;
    district?: District;
    product_count: number;
    branch_count: number;
    mandays: number;
    total_amount: number;
    cost_breakdown_data: string; // JSON string
}

// --- Billing Component (with Category & IsMandatory) ---

export interface BillingComponent {
    id: number;
    name: string;
    category: 'REGISTRASI' | 'PENETAPAN' | 'PENDAMPINGAN' | 'BPJPH' | 'MUI' | 'OPSIONAL' | 'LPH';
    type: 'FIXED' | 'PER_MANDAY' | 'PER_CABANG' | 'PER_PRODUK';
    base_amount: number;
    is_mandatory: boolean;
    business_scale_id?: number;
    province_id?: number;
    regency_id?: number;
    district_id?: number;
    business_type_id?: number;
    product_category_id?: number;
    sales_scheme_id?: number;
    data_source?: string;
}

// --- CMS ---

export interface News {
    id: number;
    title: string;
    content: string;
    category: string;
    image_url?: string;
    is_published: boolean;
    created_at: string;
}

export interface ContentBlock {
    id: number;
    slug: string;
    title: string;
    content: string;
    updated_at: string;
}

export interface Commission {
    id: string;
    type: 'REFERRAL' | 'STRUCTURAL';
    
    // Referral specific
    referrer_id?: string;
    referrer?: User;
    referred_id?: string;
    referred?: User;
    
    // Structural specific
    user_id?: string;
    user?: User;
    period?: string;
    base_omset?: number;
    
    // Common
    submission_id?: string;
    submission?: Submission;
    amount: number;
    status: 'PENDING' | 'PAID';
    paid_at?: string;
    created_at: string;
    updated_at?: string;
}
