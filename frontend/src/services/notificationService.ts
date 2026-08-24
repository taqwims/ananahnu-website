import { BaseService } from './baseService';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type?: string;
    is_read: boolean;
    created_at: string;
}

class NotificationService extends BaseService {
    async getNotifications(params?: { limit?: number; offset?: number; is_read?: boolean }): Promise<{ data: Notification[]; total: number }> {
        try {
            const query = new URLSearchParams();
            if (params?.limit) query.append('limit', String(params.limit));
            if (params?.offset) query.append('offset', String(params.offset));
            if (params?.is_read !== undefined) query.append('is_read', String(params.is_read));

            const response = await this.api.get(`/notifications?${query.toString()}`);
            return response.data || { data: [], total: 0 };
        } catch (error) {
            this.handleError(error);
        }
    }

    async markAsRead(id: string): Promise<void> {
        try {
            await this.api.put(`/notifications/${id}/read`);
        } catch (error) {
            this.handleError(error);
        }
    }

    async markAllAsRead(): Promise<void> {
        try {
            await this.api.put('/notifications/read-all');
        } catch (error) {
            this.handleError(error);
        }
    }
}

export const notificationService = new NotificationService();
