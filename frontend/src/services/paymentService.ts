import { BaseService } from './baseService';

class PaymentService extends BaseService {
    async getAllInvoices(params: URLSearchParams) {
        return (await this.api.get(`/billing/all-invoices?${params}`)).data;
    }

    async getPayments(params: URLSearchParams) {
        return (await this.api.get(`/payments/?${params}`)).data;
    }

    async markPaid(id: number) {
        return await this.api.put(`/billing/${id}/mark-paid`);
    }

    async verifyPayment(id: number, approved: boolean) {
        return await this.api.put(`/payments/${id}/verify`, { approved });
    }

    async syncPayment(id: number) {
        return await this.api.post(`/payments/${id}/sync`);
    }
}

export const paymentService = new PaymentService();
