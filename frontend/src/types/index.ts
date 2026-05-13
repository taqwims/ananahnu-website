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
    created_at?: string;
    updated_at?: string;
}

export interface Role {
    id: number;
    name: string;
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
    current_assignee_role: number;
    sales_scheme_id?: number;
    consultant_id?: string;
    consultant?: User;
    data_source?: string;
    regency_id?: number;
    district_id?: number;
    payments?: Payment[];
    invoice?: Invoice;
    field_values?: FormFieldValue[];
    cost_detail?: SubmissionCostDetail;
    sh_url?: string;
    tracking_number?: string;
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
    amount: number;
    status: 'UNPAID' | 'PAID';
    regency_id?: number;
    district_id?: number;
    pricing_source?: string;   // SCHEME_PRICE, COORDINATOR_RATE, COST_DETAIL, DEFAULT
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

export interface SubmissionCostDetail {
    id: number;
    submission_id: string;
    product_category_id?: number;
    business_scale_id?: number;
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
}

// --- Sales Scheme Price (Direct Sale vs Partnership, Organik vs Marketing) ---

export interface SalesSchemePrice {
    id: number;
    sales_scheme_id: number;
    sales_scheme?: { id: number; name: string };
    product_category_id?: number;
    product_category?: { id: number; name: string };
    business_type_id?: number;
    business_type?: { id: number; name: string };
    business_scale_id?: number;
    business_scale?: { id: number; name: string };
    data_source: 'ORGANIK' | 'MARKETING';
    base_price: number;
    discount_percent: number;
    description: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
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
