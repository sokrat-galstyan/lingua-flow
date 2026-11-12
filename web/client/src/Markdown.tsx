import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import raw from "rehype-raw";
import sanitize, { defaultSchema } from "rehype-sanitize";
import slug from "rehype-slug";
import highlight from "rehype-highlight";
import { Link } from "react-router-dom";
import { docLink } from "./api";
export function Markdown({
  text,
  path = "README.md",
}: {
  text: string;
  path?: string;
}) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[gfm]}
        rehypePlugins={[
          raw,
          [
            sanitize,
            {
              ...defaultSchema,
              clobberPrefix: "",
              attributes: {
                ...defaultSchema.attributes,
                a: [...(defaultSchema.attributes?.a || []), "id"],
              },
            },
          ],
          slug,
          highlight,
        ]}
        components={{
          a: ({ href, children, ...rest }) => {
            if (!href) return <span>{children}</span>;
            if (href.startsWith("#"))
              return (
                <a href={href} {...rest}>
                  {children}
                </a>
              );
            if (/^https?:/.test(href))
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children} ↗
                </a>
              );
            const url = new URL(href, "https://project.local/" + path);
            return (
              <Link
                to={
                  docLink(decodeURIComponent(url.pathname.slice(1))) + url.hash
                }
              >
                {children}
              </Link>
            );
          },
          img: ({ alt }) => <span>[Image: {alt || "image"}]</span>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
