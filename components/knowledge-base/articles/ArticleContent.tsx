interface Props {
  content: string;
  className?: string;
}

function isHTML(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export function ArticleContent({ content, className = "" }: Props) {
  if (isHTML(content)) {
    return (
      <div
        className={`article-content ${className}`}
        // Content is authored by authenticated org members via TipTap — not user-submitted raw HTML
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Legacy plain-text content: render as paragraphs
  return (
    <div className={`article-content ${className}`}>
      {content.split("\n\n").map((para, i) => (
        <p key={i} style={{ whiteSpace: "pre-wrap" }}>{para}</p>
      ))}
    </div>
  );
}
