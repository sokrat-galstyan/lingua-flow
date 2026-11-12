import { Link } from "react-router-dom";
import { docLink } from "../api";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Settings({ p }: { p: Project }) {
  return (
    <>
      <Title eyebrow="SIMPLE BY DESIGN" title="Your local study room" />
      <section className="card">
        <h2>Files stay in your project</h2>
        <p>
          Reading and note-taking work without an AI provider. Project views
          refresh every five seconds. Drafts stay in the editor until saved.
        </p>
        <p>
          Provider authentication belongs in the provider’s terminal
          application. Never paste passwords or API keys into a conversation.
        </p>
        <h3>Documentation</h3>
        {p.documents
          .filter((d) => d.path.startsWith("docs/") || d.path === "AGENTS.md")
          .map((d) => (
            <p key={d.path}>
              <Link to={docLink(d.path)}>{d.title}</Link>
            </p>
          ))}
        <p>
          Application setup and troubleshooting: <code>web/README.md</code>
        </p>
      </section>
    </>
  );
}
