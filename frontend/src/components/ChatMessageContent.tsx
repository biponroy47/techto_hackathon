import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  variant: "user" | "assistant";
};

export default function ChatMessageContent({ content, variant }: Props) {
  if (variant === "user") {
    return <p className="message-text">{content}</p>;
  }

  return (
    <div className="message-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
          ul: ({ children }) => <ul className="md-list">{children}</ul>,
          ol: ({ children }) => <ol className="md-list md-list--ordered">{children}</ol>,
          li: ({ children }) => <li className="md-list-item">{children}</li>,
          h1: ({ children }) => <h3 className="md-heading">{children}</h3>,
          h2: ({ children }) => <h3 className="md-heading">{children}</h3>,
          h3: ({ children }) => <h3 className="md-heading">{children}</h3>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
