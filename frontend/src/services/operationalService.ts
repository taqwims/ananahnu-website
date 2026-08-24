import { BaseService } from './baseService';
import type { Submission, User } from '../types';

export interface OperationalStats {
    total_new_submissions: number;
    unassigned_count: number;
    waiting_qc_count: number;
    waiting_hdo_count: number;
    waiting_sd_count: number;
    scheduled_audit_count: number;
    sh_terbit_count: number;
    sla_breached_count: number;
    high_priority_count: number;
    pipeline_stages: Record<string, number>;
    status_distribution: Record<string, number>;
    team_workload: {
        role: string;
        staff_name: string;
        active_tasks: number;
        completed: number;
        capacity: number;
        status: string;
    }[];
    urgent_actions: {
        id: string;
        no: string;
        business_name: string;
        issue: string;
        stage: string;
        priority: string;
        days_overdue: number;
    }[];
    recent_activities: {
        id: string;
        action: string;
        user: string;
        target: string;
        detail: string;
        created_at: string;
    }[];
}

export interface LPHPartner {
    id: string;
    name: string;
    code: string;
    region: string;
    phone: string;
    email: string;
    status: string;
}

export interface AuditorPartner {
    id: string;
    name: string;
    code: string;
    lph_id?: string;
    lph_name: string;
    phone: string;
    email: string;
    status: string;
}

export interface DailyQuota {
    id?: string;
    date: string;
    region: string;
    allocated: number;
    used_today: number;
    prev_used: number;
    notes?: string;
    updated_by?: string;
}

export interface AssignSubmissionPayload {
    assignee_id: string;
    target_role: string;
    priority?: string;
    target_deadline?: string;
    notes?: string;
    notify_staff?: boolean;
}

export interface BulkAssignPayload {
    submission_ids: string[];
    assignee_id?: string;
    target_role: string;
    dist_mode: string;
    priority?: string;
    target_deadline?: string;
    notes?: string;
}

export interface ScheduleAuditPayload {
    submission_id: string;
    audit_date: string;
    lph_name: string;
    auditor_name: string;
    notes?: string;
}

class OperationalService extends BaseService {
    async getDashboardStats(): Promise<OperationalStats> {
        try {
            const response = await this.api.get('/operational/dashboard/stats');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getSubmissions(filters: Record<string, any> = {}): Promise<{ data: Submission[]; total: number }> {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(k => {
                if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
                    params.append(k, String(filters[k]));
                }
            });
            const response = await this.api.get(`/operational/submissions?${params.toString()}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getStaffList(): Promise<User[]> {
        try {
            const response = await this.api.get('/operational/staff');
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async assignSubmission(id: string, payload: AssignSubmissionPayload): Promise<void> {
        try {
            await this.api.post(`/operational/submissions/${id}/assign`, payload);
        } catch (error) {
            this.handleError(error);
        }
    }

    async bulkAssign(payload: BulkAssignPayload): Promise<void> {
        try {
            await this.api.post('/operational/submissions/bulk-assign', payload);
        } catch (error) {
            this.handleError(error);
        }
    }

    async returnToAdvisor(id: string, note: string): Promise<void> {
        try {
            await this.api.post(`/operational/submissions/${id}/return-advisor`, { note });
        } catch (error) {
            this.handleError(error);
        }
    }

    async updatePriority(id: string, priority: string): Promise<void> {
        try {
            await this.api.post(`/operational/submissions/${id}/priority`, { priority });
        } catch (error) {
            this.handleError(error);
        }
    }

    async scheduleAudit(payload: ScheduleAuditPayload): Promise<void> {
        try {
            await this.api.post('/operational/audit/schedule', payload);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getLPHPartners(): Promise<LPHPartner[]> {
        try {
            const response = await this.api.get('/operational/lph');
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async createLPHPartner(payload: Partial<LPHPartner>): Promise<LPHPartner> {
        try {
            const response = await this.api.post('/operational/lph', payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateLPHPartner(id: string, payload: Partial<LPHPartner>): Promise<LPHPartner> {
        try {
            const response = await this.api.put(`/operational/lph/${id}`, payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteLPHPartner(id: string): Promise<void> {
        try {
            await this.api.delete(`/operational/lph/${id}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getAuditorPartners(): Promise<AuditorPartner[]> {
        try {
            const response = await this.api.get('/operational/auditors');
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async createAuditorPartner(payload: Partial<AuditorPartner>): Promise<AuditorPartner> {
        try {
            const response = await this.api.post('/operational/auditors', payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateAuditorPartner(id: string, payload: Partial<AuditorPartner>): Promise<AuditorPartner> {
        try {
            const response = await this.api.put(`/operational/auditors/${id}`, payload);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteAuditorPartner(id: string): Promise<void> {
        try {
            await this.api.delete(`/operational/auditors/${id}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getDailyQuota(date?: string): Promise<DailyQuota[]> {
        try {
            const url = date ? `/operational/quota/daily?date=${date}` : '/operational/quota/daily';
            const response = await this.api.get(url);
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async saveDailyQuota(payload: DailyQuota[]): Promise<void> {
        try {
            await this.api.post('/operational/quota/daily', payload);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getReportsSummary(period: string = 'Bulanan'): Promise<any> {
        try {
            const response = await this.api.get(`/operational/reports/summary?period=${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getSystemSettings(): Promise<Record<string, string>> {
        try {
            const response = await this.api.get('/system-settings');
            return response.data || {};
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateSystemSetting(key: string, value: string): Promise<void> {
        try {
            await this.api.put('/system-settings', { key, value });
        } catch (error) {
            this.handleError(error);
        }
    }

    async testWhatsApp(target: string, message?: string): Promise<{ message: string; result?: string }> {
        try {
            const response = await this.api.post('/operational/test-whatsapp', { target, message });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
}

export const operationalService = new OperationalService();
