import { BaseService } from './baseService';

class UserService extends BaseService {
    async getUsers(params: any) {
        return (await this.api.get('/admin/users', { params })).data;
    }

    async getRoles() {
        return (await this.api.get('/admin/roles')).data;
    }

    async createUser(data: any) {
        return (await this.api.post('/admin/users', data)).data;
    }

    async updateUser(id: string, data: any) {
        return await this.api.put(`/admin/users/${id}`, data);
    }

    async deleteUser(id: string) {
        return await this.api.delete(`/admin/users/${id}`);
    }

    async resetPassword(id: string) {
        return (await this.api.put(`/admin/users/${id}/reset-password`)).data;
    }
}

export const userService = new UserService();
