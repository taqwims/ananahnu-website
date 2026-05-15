import { BaseService } from './baseService';
import type { Submission, AuditLog, FormFieldValue, Invoice, User, Client } from '../types';

class SubmissionService extends BaseService {
    async getAll(filters: Record<string, string> = {}): Promise<Submission[]> {
        try {
            const params = new URLSearchParams(filters);
            const response = await this.api.get(`/submissions?${params.toString()}`);
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async getById(id: string): Promise<Submission> {
        try {
            const response = await this.api.get(`/submissions/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getHistory(id: string): Promise<AuditLog[]> {
        try {
            const response = await this.api.get(`/submissions/${id}/history`);
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async getFields(id: string): Promise<FormFieldValue[]> {
        try {
            const response = await this.api.get(`/submission-fields/${id}`);
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async getInvoice(id: string): Promise<Invoice | null> {
        try {
            const response = await this.api.get(`/invoices/submission/${id}`);
            return response.data;
        } catch (error) {
            // Invoice might not exist, don't throw error
            return null;
        }
    }

    async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
        try {
            await this.api.put(`/clients/${clientId}`, data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getDrafters(): Promise<User[]> {
        try {
            const response = await this.api.get('/admin/users/drafters');
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async getConsultants(): Promise<User[]> {
        try {
            const response = await this.api.get('/admin/users/consultants');
            return response.data || [];
        } catch (error) {
            this.handleError(error);
        }
    }

    async issueSH(id: string, shUrl: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/issue-sh`, { sh_url: shUrl });
        } catch (error) {
            this.handleError(error);
        }
    }

    async submit(id: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/submit`);
        } catch (error) {
            this.handleError(error);
        }
    }

    async approve(id: string, data: { drafter_id?: string } = {}): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/approve`, data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async reject(id: string, note: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/reject`, { note });
        } catch (error) {
            this.handleError(error);
        }
    }

    async assignConsultant(id: string, consultantId: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/assign-consultant`, { consultant_id: consultantId });
        } catch (error) {
            this.handleError(error);
        }
    }

    async saveAuditInfo(id: string, auditDate: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/audit-info`, { audit_date: auditDate });
        } catch (error) {
            this.handleError(error);
        }
    }

    async saveAuditResult(id: string, url1: string, url2: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/audit-result`, { 
                url1, 
                url2 
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateFields(id: string, fields: any[]): Promise<void> {
        try {
            await this.api.post(`/submission-fields/${id}`, fields);
        } catch (error) {
            this.handleError(error);
        }
    }

    async assignDrafter(id: string, drafterId: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/assign-drafter`, {
                drafter_id: drafterId
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async downloadContract(id: string, format: string = 'docx'): Promise<void> {
        try {
            const response = await this.api.get(`/documents/submissions/${id}/contract?format=${format}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `Kontrak_Layanan.${format}`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename=(.+)/);
                if (fileNameMatch) fileName = fileNameMatch[1].replace(/['"]/g, '');
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            this.handleError(error);
        }
    }
}

export const submissionService = new SubmissionService();
