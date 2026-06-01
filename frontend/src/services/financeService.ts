import { BaseService } from './baseService';

class FinanceService extends BaseService {
    // Dashboard
    async getDashboard(month?: number, year?: number) {
        const params: Record<string, string> = {};
        if (month) params.month = String(month);
        if (year) params.year = String(year);
        return (await this.api.get('/finance/dashboard', { params })).data;
    }

    // Fee Config
    async getFeeConfig() {
        return (await this.api.get('/finance/fee-config')).data || [];
    }

    async updateFeeConfig(key: string, value: number) {
        return await this.api.put('/finance/fee-config', { key, value });
    }

    // Commissions
    async getCommissions(page = 1, limit = 20, status?: string, type?: string) {
        const params: Record<string, string> = { page: String(page), limit: String(limit) };
        if (status) params.status = status;
        if (type) params.type = type;
        return (await this.api.get('/finance/commissions', { params })).data;
    }

    async payCommission(id: string) {
        return await this.api.post(`/finance/commissions/${id}/pay`);
    }

    async downloadSlip(id: string) {
        return await this.api.get(`/finance/commissions/${id}/slip`, { responseType: 'blob' });
    }

    async sendSlipWA(id: string) {
        return await this.api.post(`/finance/commissions/${id}/send-wa`);
    }

    // Lists
    async getAgents(page = 1, limit = 20) {
        return (await this.api.get('/finance/agents', { params: { page, limit } })).data;
    }

    async getClients(page = 1, limit = 20) {
        return (await this.api.get('/finance/clients', { params: { page, limit } })).data;
    }

    async getSubmissions(page = 1, limit = 20, serviceType?: string) {
        const params: Record<string, string | number> = { page, limit };
        if (serviceType) params.service_type = serviceType;
        return (await this.api.get('/finance/submissions', { params })).data;
    }

    async getManagers(page = 1, limit = 20) {
        return (await this.api.get('/finance/managers', { params: { page, limit } })).data;
    }

    // SPH
    async generateSPH(submissionId: string) {
        return (await this.api.post(`/sph/generate/${submissionId}`)).data;
    }

    async getSPH(id: number) {
        return (await this.api.get(`/sph/${id}`)).data;
    }

    async getSPHBySubmission(submissionId: string) {
        return (await this.api.get(`/sph/submission/${submissionId}`)).data;
    }

    async listSPH(page = 1, limit = 20, filters?: Record<string, string>) {
        const params: Record<string, string | number> = { page, limit, ...filters };
        return (await this.api.get('/sph', { params })).data;
    }

    async approveSPH(id: number) {
        return await this.api.put(`/sph/${id}/approve`);
    }

    // BizDev
    async getBizDevDashboard(month?: number, year?: number) {
        const params: Record<string, string> = {};
        if (month) params.month = String(month);
        if (year) params.year = String(year);
        return (await this.api.get('/bizdev/dashboard', { params })).data;
    }

    async getMonthlyProgress(year: number) {
        return (await this.api.get('/bizdev/monthly-progress', { params: { year } })).data;
    }

    async getBizDevSubmissions(page = 1, limit = 20, filters?: Record<string, string>) {
        const params: Record<string, string | number> = { page, limit, ...filters };
        return (await this.api.get('/bizdev/submissions', { params })).data;
    }

    async getTargets() {
        return (await this.api.get('/bizdev/targets')).data || [];
    }

    async setTarget(target: any) {
        return await this.api.post('/bizdev/targets', target);
    }

    async deleteTarget(id: number) {
        return await this.api.delete(`/bizdev/targets/${id}`);
    }
}

export const financeService = new FinanceService();
