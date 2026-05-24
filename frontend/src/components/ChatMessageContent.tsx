import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  variant: "user" | "assistant";
};

const assistantMarkdownComponents: Components = {
  p: ({ children }) => <p className="md-paragraph">{children}</p>,
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  ul: ({ children }) => <ul className="md-list">{children}</ul>,
  ol: ({ children }) => <ol className="md-list md-list--ordered">{children}</ol>,
  li: ({ children }) => <li className="md-list-item">{children}</li>,
  h1: ({ children }) => <h3 className="md-heading md-heading--main">{children}</h3>,
  h2: ({ children }) => <h3 className="md-heading md-heading--main">{children}</h3>,
  h3: ({ children }) => <h4 className="md-heading">{children}</h4>,
  h4: ({ children }) => <h5 className="md-heading md-heading--sub">{children}</h5>,
  blockquote: ({ children }) => <blockquote className="md-callout">{children}</blockquote>,
  hr: () => <hr className="md-divider" aria-hidden="true" />,
  table: ({ children }) => (
    <div className="md-table-wrap">
      <table className="md-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  code: ({ children }) => <code className="md-inline-code">{children}</code>
};

export default function ChatMessageContent({ content, variant }: Props) {
  if (variant === "user") {
    return <p className="message-text">{content}</p>;
  }

  return (
    <div className="message-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={assistantMarkdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
