import type { AxiosInstance } from 'axios';
import api from './api';

export abstract class BaseService {
    protected api: AxiosInstance;

    constructor() {
        this.api = api;
    }

    protected handleError(error: any): never {
        const message = error.response?.data?.error || error.message || 'Terjadi kesalahan sistem';
        throw new Error(message);
    }

    async uploadMedia(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await this.api.post('/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.url;
        } catch (error) {
            this.handleError(error);
        }
    }
}
