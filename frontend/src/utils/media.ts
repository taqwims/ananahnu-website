const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://halalcore.id';

/**
 * Resolves media URLs for in-app display (both absolute URLs and relative upload paths like /uploads/...).
 */
export function getMediaUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_URL}${cleanUrl}`;
}

/**
 * Resolves media URLs to a guaranteed absolute URL starting with https:// or http:// for SEO OpenGraph & Social Sharing.
 * Social crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn) strictly require absolute URLs.
 */
export function getAbsoluteMediaUrl(url?: string | null): string {
    if (!url) return `${SITE_URL}/icon.png`;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const base = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : SITE_URL;
    return `${base}${cleanUrl}`;
}
