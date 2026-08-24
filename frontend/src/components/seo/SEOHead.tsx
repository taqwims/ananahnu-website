import { useEffect } from 'react';

export interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    ogImage?: string;
    ogType?: 'website' | 'article';
    canonicalUrl?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
    schema?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Halal Core | Building Halal Business Excellence';
const DEFAULT_DESCRIPTION = 'Halal Core adalah platform ekosistem halal global terpercaya. Layanan pendampingan sertifikasi halal online, pelatihan profesional, sistem digital, dan konsultasi bisnis halal.';
const DEFAULT_KEYWORDS = 'sertifikasi halal, halal core, pendampingan halal online, pelatihan halal, sertifikat halal indonesia, bpjph, halal indonesia';
const DEFAULT_AUTHOR = 'Halal Core Agency';
const DEFAULT_OG_IMAGE = 'https://halalcore.id/icon.png';
const SITE_NAME = 'Halal Core';

export const SEOHead = ({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    author = DEFAULT_AUTHOR,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    canonicalUrl,
    publishedTime,
    modifiedTime,
    section,
    tags,
    schema,
}: SEOHeadProps) => {
    useEffect(() => {
        // 1. Update Title
        const pageTitle = title ? (title.includes('Halal Core') ? title : `${title} | Halal Core`) : DEFAULT_TITLE;
        document.title = pageTitle;

        // 2. Helper to set/create meta tag
        const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string | undefined) => {
            if (content === undefined || content === null) return;
            let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attrName, attrValue);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // 3. Set standard meta tags
        setMetaTag('name', 'description', description);
        setMetaTag('name', 'keywords', keywords);
        setMetaTag('name', 'author', author);
        setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

        // 4. Set Canonical Link
        const currentUrl = canonicalUrl || window.location.href;
        let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', currentUrl);

        // 5. Set Open Graph (Facebook/WhatsApp/LinkedIn)
        setMetaTag('property', 'og:site_name', SITE_NAME);
        setMetaTag('property', 'og:title', title || DEFAULT_TITLE);
        setMetaTag('property', 'og:description', description);
        setMetaTag('property', 'og:image', ogImage);
        if (ogImage && ogImage.startsWith('https://')) {
            setMetaTag('property', 'og:image:secure_url', ogImage);
        }
        setMetaTag('property', 'og:image:width', '1200');
        setMetaTag('property', 'og:image:height', '630');
        setMetaTag('property', 'og:image:alt', title || 'Halal Core');
        setMetaTag('property', 'og:url', currentUrl);
        setMetaTag('property', 'og:type', ogType);
        setMetaTag('property', 'og:locale', 'id_ID');

        if (ogType === 'article') {
            if (publishedTime) setMetaTag('property', 'article:published_time', publishedTime);
            if (modifiedTime) setMetaTag('property', 'article:modified_time', modifiedTime);
            if (author) setMetaTag('property', 'article:author', author);
            if (section) setMetaTag('property', 'article:section', section);
            if (tags && tags.length > 0) {
                tags.forEach(t => setMetaTag('property', 'article:tag', t));
            }
        }

        // 6. Set Twitter Card
        setMetaTag('property', 'twitter:card', 'summary_large_image');
        setMetaTag('property', 'twitter:title', title || DEFAULT_TITLE);
        setMetaTag('property', 'twitter:description', description);
        setMetaTag('property', 'twitter:image', ogImage);
        setMetaTag('property', 'twitter:url', currentUrl);

        // 7. Inject JSON-LD Schema
        let scriptSchema = document.getElementById('dynamic-seo-schema') as HTMLScriptElement | null;
        if (schema) {
            if (!scriptSchema) {
                scriptSchema = document.createElement('script');
                scriptSchema.id = 'dynamic-seo-schema';
                scriptSchema.type = 'application/ld+json';
                document.head.appendChild(scriptSchema);
            }
            scriptSchema.textContent = JSON.stringify(schema);
        } else if (scriptSchema) {
            scriptSchema.remove();
        }

        return () => {
            // Cleanup schema if needed
        };
    }, [title, description, keywords, author, ogImage, ogType, canonicalUrl, publishedTime, modifiedTime, section, tags, schema]);

    return null;
};

export default SEOHead;
