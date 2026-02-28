import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../contexts/ThemeContext';
import type { Components } from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const { resolved } = useTheme();
  const codeStyle = resolved === 'dark' ? oneDark : oneLight;

  const components: Components = {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    code({ className: codeClassName, children, ...props }) {
      const match = /language-(\w+)/.exec(codeClassName || '');
      if (match) {
        return (
          <div className="obsidian-code-block">
            <span className="obsidian-code-lang">{match[1]}</span>
            <SyntaxHighlighter
              style={codeStyle}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1rem',
                borderRadius: '0 0 6px 6px',
                fontSize: '13px',
                background: 'var(--code-bg, var(--bg-secondary))',
              }}
              codeTagProps={{ style: { fontFamily: 'inherit' } }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`obsidian-markdown-preview ${className ?? ''}`.trim()} style={{ minHeight: 400 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content || '*No content yet*'}
      </ReactMarkdown>
    </div>
  );
}
