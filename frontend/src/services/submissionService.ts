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

    async updateClientInfoAndPricing(id: string, data: any): Promise<void> {
        try {
            await this.api.put(`/submissions/${id}/client-info`, data);
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

    async getConsultants(provinceId?: number | string, regencyId?: number | string): Promise<User[]> {
        try {
            let url = '/admin/users/consultants';
            const params: string[] = [];
            if (provinceId) params.push(`province_id=${provinceId}`);
            if (regencyId) params.push(`regency_id=${regencyId}`);
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }
            const response = await this.api.get(url);
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

    async revokeSH(id: string, note?: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/revoke-sh`, { note });
        } catch (error) {
            this.handleError(error);
        }
    }

    async submitSJPH(id: string, data: { sjph_url: string; notes?: string }): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/submit-sjph`, data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async approveSJPH(id: string): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/approve-sjph`);
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

    async reject(id: string, data: { note: string; target_status?: string; invalid_fields?: string[] } | string): Promise<void> {
        try {
            const payload = typeof data === 'string' ? { note: data } : data;
            await this.api.post(`/submissions/${id}/reject`, payload);
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

    async updateBusinessType(id: string, businessTypeId: number): Promise<void> {
        try {
            await this.api.post(`/submissions/${id}/business-type`, { business_type_id: businessTypeId });
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

    async downloadContract(id: string, format: string = 'pdf'): Promise<void> {
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

    async downloadSJPH(id: string): Promise<void> {
        try {
            const response = await this.api.get(`/documents/submissions/${id}/sjph`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'Dokumen_SJPH.pdf';
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
