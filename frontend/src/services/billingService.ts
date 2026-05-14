import { BaseService } from './baseService';

class BillingService extends BaseService {
    // Master Data
    async getProductCategories() {
        return (await this.api.get('/billing-config/product-categories')).data || [];
    }

    async getBusinessScales() {
        return (await this.api.get('/billing-config/business-scales')).data || [];
    }

    async getSalesSchemes() {
        return (await this.api.get('/billing-config/sales-schemes')).data || [];
    }

    async getBusinessTypes() {
        return (await this.api.get('/billing-config/business-types')).data || [];
    }

    // Components
    async getComponents() {
        return (await this.api.get('/billing-config/components')).data || [];
    }

    async createComponent(data: any) {
        return await this.api.post('/billing-config/components', data);
    }

    async updateComponent(id: number, data: any) {
        return await this.api.put(`/billing-config/components/${id}`, data);
    }

    async deleteComponent(id: number) {
        return await this.api.delete(`/billing-config/components/${id}`);
    }

    // Generic Master CRUD
    async createMaster(endpoint: string, data: any) {
        return await this.api.post(endpoint, data);
    }

    async updateMaster(endpoint: string, id: number, data: any) {
        return await this.api.put(`${endpoint}/${id}`, data);
    }

    async deleteMaster(endpoint: string, id: number) {
        return await this.api.delete(`${endpoint}/${id}`);
    }

    // Geography
    async getProvinces() {
        return (await this.api.get('/geography/provinces')).data || [];
    }

    async getRegencies(provinceId: string | number) {
        return (await this.api.get(`/geography/regencies/${provinceId}`)).data || [];
    }

    async getDistricts(regencyId: string | number) {
        return (await this.api.get(`/geography/districts/${regencyId}`)).data || [];
    }

    // System Settings
    async getSystemSettings() {
        return (await this.api.get('/system-settings')).data || {};
    }

    async updateSystemSetting(key: string, value: string) {
        return await this.api.put('/system-settings', { key, value });
    }
}

export const billingService = new BillingService();
