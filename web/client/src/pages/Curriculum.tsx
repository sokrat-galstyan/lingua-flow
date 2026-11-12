import { Link } from "react-router-dom";
import { docLink } from "../api";
import { Markdown } from "../Markdown";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Curriculum({ p }: { p: Project }) {
  return (
    <>
      <Title
        eyebrow="YOUR CONTINUOUS ROADMAP"
        title="Build understanding, layer by layer."
      />
      <Link to={docLink("curriculum/master-curriculum.md")}>
        Read the full curriculum →
      </Link>
      {p.phases.map((phase) => (
        <section className="week" key={phase.id}>
          <h2>{phase.title}</h2>
          {p.units
            .filter((u) => u.phase === phase.id)
            .map((u) => (
              <details className="card unit" key={u.id}>
                <summary>
                  {u.id} · {u.title}
                </summary>
                <Markdown
                  text={u.content}
                  path="curriculum/master-curriculum.md"
                />
                <h3>Related lessons</h3>
                {p.documents
                  .filter((d) => d.id && d.units.includes(u.id))
                  .map((d) => (
                    <p key={d.path}>
                      <Link to={docLink(d.path)}>{d.title}</Link>
                    </p>
                  ))}
              </details>
            ))}
        </section>
      ))}
    </>
  );
}
