import { useMemo } from 'react';
import Codicon from './Codicon';

interface Heading {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(content: string): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      headings.push({ level, text, id });
    }
  }
  return headings;
}

interface DocumentOutlineProps {
  content: string;
  onHeadingClick?: (id: string) => void;
}

export default function DocumentOutline({ content, onHeadingClick }: DocumentOutlineProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  return (
    <div className="document-outline">
      <div className="document-outline-header">
        <Codicon name="file-text" size={14} />
        <span>Outline</span>
      </div>
      <nav className="document-outline-list">
        {headings.length === 0 ? (
          <span className="document-outline-empty">No headings</span>
        ) : (
          headings.map((h) => (
            <a
              key={`${h.level}-${h.id}`}
              href={`#${h.id}`}
              className={`outline-item outline-h${h.level}`}
              onClick={(e) => {
                if (onHeadingClick) {
                  e.preventDefault();
                  onHeadingClick(h.id);
                }
              }}
            >
              {h.text}
            </a>
          ))
        )}
      </nav>
    </div>
  );
}
