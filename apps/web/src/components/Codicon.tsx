interface CodiconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders a VS Code codicon. See https://microsoft.github.io/vscode-codicons/dist/codicon.html */
export default function Codicon({ name, size = 16, className = '', style = {}, ...rest }: CodiconProps & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`codicon codicon-${name} ${className}`.trim()}
      style={{
        fontSize: size,
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        ...style,
      }}
      role="img"
      aria-hidden
      {...rest}
    />
  );
}
