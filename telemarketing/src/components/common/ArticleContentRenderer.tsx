import React from 'react';
import { Sparkles } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/imageOptimizer';

interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: ***bold italic***, **bold**, *italic*, `code`, and [link](url)
 */
export const renderInlineFormatting = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split tokens by bold-italic, bold, italic, code, and link syntax
  const regex = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|\*[^\*\n]+?\*|_[^_\n]+?_|`[^`\n]+?`|\[[^\]]+?\]\([^\)]+?\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={index} className="font-extrabold italic text-dark-950">
          {renderInlineFormatting(part.slice(3, -3))}
        </strong>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-extrabold text-dark-950">
          {renderInlineFormatting(part.slice(2, -2))}
        </strong>
      );
    }

    // Bold: __text__
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return (
        <strong key={index} className="font-extrabold text-dark-950">
          {renderInlineFormatting(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-dark-900">
          {renderInlineFormatting(part.slice(1, -1))}
        </em>
      );
    }

    // Italic: _text_
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      return (
        <em key={index} className="italic text-dark-900">
          {renderInlineFormatting(part.slice(1, -1))}
        </em>
      );
    }

    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded-md bg-dark-100 text-brand-700 font-mono text-xs font-semibold">
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
          className="text-brand-600 hover:text-brand-800 font-bold underline decoration-brand-300 hover:decoration-brand-600 transition-colors"
        >
          {renderInlineFormatting(label)}
        </a>
      );
    }

    // Handle single line breaks inside paragraphs
    if (part.includes('\n')) {
      const subLines = part.split('\n');
      return subLines.map((line, lIdx) => (
        <React.Fragment key={`${index}-${lIdx}`}>
          {line}
          {lIdx < subLines.length - 1 && <br />}
        </React.Fragment>
      ));
    }

    return part;
  });
};

export const ArticleContentRenderer = ({ content, className = '' }: ArticleContentRendererProps) => {
  if (!content || !content.trim()) {
    return <p className="text-dark-400 italic text-sm">Belum ada konten artikel.</p>;
  }

  const blocks = content.split('\n\n');

  return (
    <div className={`space-y-6 text-dark-800 text-sm sm:text-base leading-relaxed font-sans ${className}`}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Heading 1 (# Heading)
        if (trimmed.startsWith('# ')) {
          const text = trimmed.replace(/^#\s+/, '');
          return (
            <h1
              key={idx}
              className="text-2xl sm:text-3xl font-black text-brand-900 mt-8 mb-4 pt-4 border-b border-dark-100 pb-2 tracking-tight"
            >
              {renderInlineFormatting(text)}
            </h1>
          );
        }

        // 2. Heading 2 (## Heading)
        if (trimmed.startsWith('## ')) {
          const text = trimmed.replace(/^##\s+/, '');
          const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h2
              key={idx}
              id={id}
              className="text-xl sm:text-2xl font-extrabold text-brand-900 mt-7 mb-3 pt-3 border-b border-dark-100 pb-1.5 tracking-tight scroll-mt-24"
            >
              {renderInlineFormatting(text)}
            </h2>
          );
        }

        // 3. Heading 3 (### Heading)
        if (trimmed.startsWith('### ')) {
          const text = trimmed.replace(/^###\s+/, '');
          const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h3
              key={idx}
              id={id}
              className="text-lg sm:text-xl font-bold text-brand-900 mt-5 mb-2 tracking-tight scroll-mt-24"
            >
              {renderInlineFormatting(text)}
            </h3>
          );
        }

        // 4. In-Content Image Parser: ![Caption](url)
        const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imageMatch) {
          const [, caption, imgUrl] = imageMatch;
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-dark-200 bg-white shadow-xs">
              <img
                src={resolveMediaUrl(imgUrl)}
                alt={caption || 'Gambar Artikel HalalCore'}
                loading="lazy"
                className="w-full max-h-[500px] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80';
                }}
              />
              {caption && (
                <figcaption className="p-3 text-center text-xs text-dark-500 font-medium italic bg-dark-50/70 border-t border-dark-100">
                  📷 {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // 5. Markdown Table (| Col 1 | Col 2 | ...)
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length >= 2 && lines.some(l => l.includes('---'))) {
            const headerLineIndex = lines.findIndex(l => !l.includes('---'));
            const separatorIndex = lines.findIndex(l => l.includes('---'));

            if (headerLineIndex !== -1 && separatorIndex > headerLineIndex) {
              const headerLine = lines[headerLineIndex];
              const headers = headerLine
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map(c => c.trim())
                .filter(c => c.length > 0);

              const rowLines = lines.slice(separatorIndex + 1);
              const rows = rowLines.map(rowLine =>
                rowLine
                  .replace(/^\|/, '')
                  .replace(/\|$/, '')
                  .split('|')
                  .map(c => c.trim())
                  .filter(c => c.length > 0)
              );

              return (
                <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-dark-200 bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="bg-brand-50/80 border-b border-dark-200 text-brand-950 font-extrabold uppercase text-[11px] tracking-wider">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="px-4 py-3 border-r border-dark-200/60 last:border-r-0 whitespace-nowrap sm:whitespace-normal">
                            {renderInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100 text-dark-700">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-brand-50/20 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 border-r border-dark-100 last:border-r-0 leading-relaxed whitespace-nowrap sm:whitespace-normal">
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

        // 6. Callout Box / Tip (> 💡 ... or > Tips: ...)
        if (trimmed.startsWith('> 💡') || trimmed.startsWith('> Tips:') || trimmed.startsWith('> TIPS:')) {
          return (
            <div key={idx} className="my-5 p-4.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-sm leading-relaxed flex items-start gap-3.5 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
              </div>
            </div>
          );
        }

        // 7. Blockquote (> Quote)
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="my-5 p-4 sm:p-5 rounded-2xl bg-brand-50/70 border-l-4 border-brand-600 text-brand-950 font-medium italic shadow-xs">
              {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
            </blockquote>
          );
        }

        // 8. Divider (--- or ***)
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-6 border-dark-200" />;
        }

        // 9. Bullet List (- item or * item)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter(Boolean);
          return (
            <ul key={idx} className="space-y-2 my-4 pl-5 list-disc list-outside text-dark-700">
              {items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {renderInlineFormatting(item.replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // 10. Numbered List (1. item)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter(Boolean);
          return (
            <ol key={idx} className="space-y-2 my-4 pl-5 list-decimal list-outside text-dark-700">
              {items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {renderInlineFormatting(item.replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // 11. Standard Paragraph
        return (
          <p key={idx} className="text-dark-700 leading-relaxed font-normal">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default ArticleContentRenderer;
