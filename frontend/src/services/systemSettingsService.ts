import { BaseService } from './baseService';

class SystemSettingsService extends BaseService {
    async getAll(): Promise<{ [key: string]: string }> {
        try {
            const response = await this.api.get('/system-settings');
            return response.data || {};
        } catch (error) {
            this.handleError(error);
        }
    }

    async update(key: string, value: string): Promise<void> {
        try {
            await this.api.put('/system-settings', { key, value });
        } catch (error) {
            this.handleError(error);
        }
    }
}

export const systemSettingsService = new SystemSettingsService();
