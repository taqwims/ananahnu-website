export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
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
}

export interface Submission {
    id: string;
    client_id: string;
    client?: Client;
    status: SubmissionStatus;
    current_assignee_role: number;
    payments?: Payment[];
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
