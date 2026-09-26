import api from './api';

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  thumbnail_url: string;
  tags: string;
  author_name: string;
  reading_time: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_image_url: string;
  is_published: boolean;
  is_featured: boolean;
  show_on_landing: boolean;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface NewsPaginationResponse {
  data: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface NewsDetailResponse {
  data: NewsArticle;
  related?: NewsArticle[];
}

export interface NewsInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category?: string;
  thumbnail_url?: string;
  tags?: string;
  author_name?: string;
  reading_time?: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  og_image_url?: string;
  is_published?: boolean;
  is_featured?: boolean;
  show_on_landing?: boolean;
}

// ── Public News Endpoints ──────────────────────────────────────────

export const getPublicNews = (params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  featured_only?: boolean;
  landing_only?: boolean;
}) => api.get<NewsPaginationResponse>('/public/cms/news', { params });

export const getPublicNewsCategories = () =>
  api.get<{ data: string[] }>('/public/cms/news/categories');

export const getPublicNewsDetail = (slug: string) =>
  api.get<NewsDetailResponse>(`/public/cms/news/${slug}`);

// ── Admin News CMS Endpoints ───────────────────────────────────────

export const getAdminNews = (params?: {
  search?: string;
  category?: string;
  is_published?: boolean | string;
  is_featured?: boolean | string;
  page?: number;
  limit?: number;
}) => api.get<NewsPaginationResponse>('/admin/cms/news', { params });

export const getAdminNewsByID = (id: number | string) =>
  api.get<{ data: NewsArticle } | NewsArticle>(`/admin/cms/news/${id}`);

export const createNews = (data: NewsInput) =>
  api.post<{ data: NewsArticle; message: string }>('/admin/cms/news', data);

export const updateNews = (id: number | string, data: Partial<NewsInput>) =>
  api.put<{ data: NewsArticle; message: string }>(`/admin/cms/news/${id}`, data);

export const toggleNewsStatus = (id: number | string) =>
  api.patch<{ message: string; is_published: boolean }>(`/admin/cms/news/${id}/status`);

export const toggleNewsFeatured = (id: number | string) =>
  api.patch<{ message: string; is_featured: boolean }>(`/admin/cms/news/${id}/featured`);

export const toggleNewsLanding = (id: number | string) =>
  api.patch<{ message: string; show_on_landing: boolean }>(`/admin/cms/news/${id}/landing`);

export const deleteNews = (id: number | string) =>
  api.delete<{ message: string }>(`/admin/cms/news/${id}`);
