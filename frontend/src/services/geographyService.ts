import { BaseService } from './baseService';

class GeographyService extends BaseService {
    // Provinces
    async getProvinces() {
        return (await this.api.get('/geography/provinces')).data;
    }
    async createProvince(name: string) {
        return await this.api.post('/geography/provinces', { name });
    }
    async deleteProvince(id: number) {
        return await this.api.delete(`/geography/provinces/${id}`);
    }

    // Regencies
    async getRegencies(provinceId: number) {
        return (await this.api.get(`/geography/regencies/${provinceId}`)).data;
    }
    async createRegency(provinceId: number, name: string) {
        return await this.api.post('/geography/regencies', { province_id: provinceId, name });
    }
    async deleteRegency(id: number) {
        return await this.api.delete(`/geography/regencies/${id}`);
    }

    // Districts
    async getDistricts(regencyId: number) {
        return (await this.api.get(`/geography/districts/${regencyId}`)).data;
    }
    async createDistrict(regencyId: number, name: string) {
        return await this.api.post('/geography/districts', { regency_id: regencyId, name });
    }
    async deleteDistrict(id: number) {
        return await this.api.delete(`/geography/districts/${id}`);
    }

    // Billing Rates
    async getRates(serviceType?: string) {
        const params = serviceType ? `?service_type=${serviceType}` : '';
        return (await this.api.get(`/billing-rates/${params}`)).data;
    }
    async createRate(data: any) {
        return await this.api.post('/billing-rates/', data);
    }
    async deleteRate(id: number) {
        return await this.api.delete(`/billing-rates/${id}`);
    }
}

export const geographyService = new GeographyService();
