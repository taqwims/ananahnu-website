import type { User } from './index';

export type PriorityLevel = 'Normal' | 'Tinggi' | 'Mendesak' | 'Kritis';
export type BackendPriority = 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export interface SubmissionItem {
    id: string;
    no: string;
    date: string;
    businessName: string;
    serviceType: string;
    advisor: string;
    region: string;
    completeness: 'Lengkap' | 'Belum Lengkap' | 'Perlu Perbaikan';
    assignStatus: string;
    priority: PriorityLevel;
    age: string;
    sla: string;
    isOverdue?: boolean;
    assignedStaff?: string;
    assignedQco?: string;
    assignedDrafter?: string;
    notes?: string;
}

export interface QCQueueItem {
    id: string;
    no: string;
    date?: string;
    businessName: string;
    nib?: string;
    serviceType: string;
    advisor: string;
    advisorCode?: string;
    qco: string;
    qcoCode?: string;
    region?: string;
    qcStatus?: string;
    statusQC?: string;
    priority: PriorityLevel;
    age?: string;
    sla?: string;
    slaDays?: string;
    slaPercentage?: string;
    slaIsOver?: boolean;
    isOverdue?: boolean;
    notes?: string;
}

export interface HDOQueueItem {
    id: string;
    no: string;
    sihalalNo: string;
    businessName: string;
    serviceType: string;
    advisor: string;
    hdo: string;
    statusHDO: string;
    progress: number;
    age: string;
    slaDays: string;
    slaPercentage: string;
    slaIsOver: boolean;
    priority: PriorityLevel;
}

export interface SDItem {
    id: string;
    no: string;
    sihalalNo: string;
    businessName: string;
    ownerName: string;
    verifikator: string;
    advisor: string;
    fundingType: 'Fasilitasi BPJPH' | 'Mandiri';
    status: 'Menunggu Verifikasi' | 'Sedang Diverifikasi' | 'Perlu Perbaikan' | 'Menunggu Perbaikan Pelaku Usaha' | 'Lolos Verifikasi' | 'Menunggu Penetapan Halal';
    processPosition: string;
    processAge: string;
    slaDays: string;
    slaPercentage: string;
    actionType: string;
}

export interface AuditScheduleItem {
    id: string;
    submission_id: string;
    tracking_number: string;
    business_name: string;
    lph_name: string;
    auditor_id?: string;
    auditor_name: string;
    lead_auditor?: string;
    team_members?: string[];
    audit_date: string;
    audit_end_date?: string;
    audit_type: 'LAPANGAN' | 'KANTOR' | 'ONLINE';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    location: string;
    notes?: string;
    meeting_link?: string;
    sla_days?: number;
}

export interface FacilitationQuota {
    id: string;
    institution: string;
    program_name: string;
    province: string;
    total_quota: number;
    used_quota: number;
    available_quota: number;
    start_date?: string;
    end_date?: string;
    status: string;
    terms?: string;
    pic_name?: string;
    pic_phone?: string;
}

export interface LphAuditor {
    id: string;
    lph_id: string;
    lph_name: string;
    name: string;
    reg_number: string;
    competence_scope: string;
    phone: string;
    email: string;
    active_audits: number;
    max_concurrent: number;
    rating: number;
    status: string;
    certificate_valid_until: string;
}

export interface OperationalStaff {
    id: string;
    full_name: string;
    username: string;
    role?: any;
    email?: string;
    phone?: string;
    active_tasks?: number;
}

export interface SendReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    submissionId: string;
    submissionNo: string;
    businessName: string;
    advisorName: string;
    defaultRecipient?: 'ADVISOR' | 'CLIENT' | 'QCO' | 'AUDITOR';
    onSuccess?: () => void;
}

export interface SingleAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    submissionId: string;
    submissionNo: string;
    businessName: string;
    currentStage?: string;
    staffList: User[];
    onSuccess?: (assignedStaffName: string) => void;
}

export interface ReturnAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    submissionId: string;
    submissionNo: string;
    businessName: string;
    advisorName: string;
    onSuccess?: () => void;
}

export interface ChangePriorityModalProps {
    isOpen: boolean;
    onClose: () => void;
    submissionId: string;
    submissionNo: string;
    currentPriority: PriorityLevel;
    onSuccess?: (newPriority: PriorityLevel) => void;
}
