import React from 'react';
import { Sparkles } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

interface ArticleContentRendererProps {
    content: string;
    className?: string;
}

// Helper to parse inline formatting: **bold**, *italic*, [link](url), `code`
export const renderInlineFormatting = (text: string): React.ReactNode => {
    if (!text) return null;

    // Pattern to match bold, italic, links, and code
    const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\)|\`.*?\`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (!part) return null;

        // Bold: **text**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
                <strong key={index} className="font-bold text-gray-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }

        // Italic: *text*
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            return (
                <em key={index} className="italic text-gray-800">
                    {part.slice(1, -1)}
                </em>
            );
        }

        // Code: `text`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            return (
                <code key={index} className="px-1.5 py-0.5 rounded bg-gray-100 text-brand-700 font-mono text-xs font-semibold">
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Link: [label](url)
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
            const [, label, url] = linkMatch;
            return (
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 font-semibold underline decoration-brand-300 hover:decoration-brand-600 transition-colors"
                >
                    {label}
                </a>
            );
        }

        return part;
    });
};

export const ArticleContentRenderer = ({ content, className = '' }: ArticleContentRendererProps) => {
    if (!content) {
        return <p className="text-gray-400 italic">Belum ada konten artikel.</p>;
    }

    const blocks = content.split('\n\n');

    return (
        <div className={`space-y-6 text-gray-800 text-base leading-relaxed ${className}`}>
            {blocks.map((block, idx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // 1. Heading 2 (## Heading)
                if (trimmed.startsWith('## ')) {
                    const text = trimmed.replace(/^##\s+/, '');
                    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    return (
                        <h2
                            key={idx}
                            id={id}
                            className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-10 mb-4 pt-4 border-t border-gray-100 scroll-mt-24 tracking-tight"
                        >
                            {renderInlineFormatting(text)}
                        </h2>
                    );
                }

                // 2. Heading 3 (### Heading)
                if (trimmed.startsWith('### ')) {
                    const text = trimmed.replace(/^###\s+/, '');
                    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    return (
                        <h3
                            key={idx}
                            id={id}
                            className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-3 scroll-mt-24 tracking-tight"
                        >
                            {renderInlineFormatting(text)}
                        </h3>
                    );
                }

                // 3. Image in middle of article: ![Caption](url)
                const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imageMatch) {
                    const [, caption, imgUrl] = imageMatch;
                    return (
                        <figure key={idx} className="my-8 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-gray-50 group">
                            <div className="relative overflow-hidden max-h-[500px] bg-gray-900 flex items-center justify-center">
                                <img
                                    src={getMediaUrl(imgUrl)}
                                    alt={caption || 'Gambar Artikel Halal Core'}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 max-h-[500px]"
                                    loading="lazy"
                                />
                            </div>
                            {caption && (
                                <figcaption className="p-3.5 text-center text-xs text-gray-600 bg-gray-50/90 border-t border-gray-100 font-medium italic">
                                    📷 {caption}
                                </figcaption>
                            )}
                        </figure>
                    );
                }

                // 4. Markdown Table (| Col 1 | Col 2 | ...)
                if (trimmed.includes('|') && trimmed.includes('\n')) {
                    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
                    if (lines.length >= 2 && lines.some(l => l.includes('---'))) {
                        const headerLineIndex = lines.findIndex(l => !l.includes('---'));
                        const separatorIndex = lines.findIndex(l => l.includes('---'));

                        if (headerLineIndex !== -1 && separatorIndex > headerLineIndex) {
                            const headerLine = lines[headerLineIndex];
                            const headers = headerLine
                                .split('|')
                                .map(c => c.trim())
                                .filter(c => c.length > 0);

                            const rowLines = lines.slice(separatorIndex + 1);
                            const rows = rowLines.map(rowLine => 
                                rowLine
                                    .split('|')
                                    .map(c => c.trim())
                                    .filter(c => c.length > 0)
                            );

                            return (
                                <div key={idx} className="my-8 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                                        <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 font-bold border-b border-gray-200">
                                            <tr>
                                                {headers.map((h, hIdx) => (
                                                    <th key={hIdx} className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                                                        {renderInlineFormatting(h)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {rows.map((row, rIdx) => (
                                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white hover:bg-gray-50/80 transition-colors' : 'bg-slate-50/50 hover:bg-gray-50/80 transition-colors'}>
                                                    {row.map((cell, cIdx) => (
                                                        <td key={cIdx} className="px-4 py-3 text-gray-700 font-normal">
                                                            {renderInlineFormatting(cell)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        }
                    }
                }

                // 5. Callout Box / Tip (> 💡 Tips: ...)
                if (trimmed.startsWith('> 💡') || trimmed.startsWith('> Tips:') || trimmed.startsWith('> TIPS:')) {
                    return (
                        <div key={idx} className="my-6 p-4.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-sm leading-relaxed flex items-start gap-3.5 shadow-sm">
                            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
                            </div>
                        </div>
                    );
                }

                // 6. Blockquote (> Quote)
                if (trimmed.startsWith('> ')) {
                    return (
                        <blockquote key={idx} className="my-6 pl-4 border-l-4 border-brand-600 italic text-gray-700 bg-brand-50/40 p-4 rounded-r-2xl text-base leading-relaxed">
                            {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
                        </blockquote>
                    );
                }

                // 7. Divider (--- or ***)
                if (trimmed === '---' || trimmed === '***') {
                    return <hr key={idx} className="my-8 border-gray-200" />;
                }

                // 8. Bullet List (- item or * item)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const items = trimmed.split('\n').filter(Boolean);
                    return (
                        <ul key={idx} className="my-4 space-y-2 list-disc list-outside text-gray-700 text-base leading-relaxed pl-6">
                            {items.map((item, i) => (
                                <li key={i}>
                                    {renderInlineFormatting(item.replace(/^[-*]\s+/, ''))}
                                </li>
                            ))}
                        </ul>
                    );
                }

                // 9. Numbered List (1. item)
                if (/^\d+\.\s+/.test(trimmed)) {
                    const items = trimmed.split('\n').filter(Boolean);
                    return (
                        <ol key={idx} className="my-4 space-y-2 list-decimal list-outside text-gray-700 text-base leading-relaxed pl-6">
                            {items.map((item, i) => (
                                <li key={i}>
                                    {renderInlineFormatting(item.replace(/^\d+\.\s+/, ''))}
                                </li>
                            ))}
                        </ol>
                    );
                }

                // 10. Regular Paragraph
                return (
                    <p key={idx} className="text-gray-700 text-base sm:text-lg leading-relaxed mb-5">
                        {renderInlineFormatting(trimmed)}
                    </p>
                );
            })}
        </div>
    );
};

export default ArticleContentRenderer;
