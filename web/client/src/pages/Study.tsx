import { Link, useSearchParams } from "react-router-dom";
import { docLink } from "../api";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Study({ p }: { p: Project }) {
  const [params] = useSearchParams();
  const cycles = [
    ...new Set(p.documents.map((d) => d.cycle).filter(Boolean)),
  ] as string[];
  const selected = params.get("cycle") || p.activeCycle || cycles[0];
  const docs = p.documents.filter((d) => d.cycle === selected);
  const sessions = docs.filter((d) => d.id);
  return (
    <>
      <Title eyebrow="YOUR STUDY PLAN" title="One week at a time.">
        <p className="muted">
          Five integrated lessons, a review, and space to rest.
        </p>
      </Title>
      <div className="tabs">
        {cycles.map((c) => (
          <Link
            className={c === selected ? "selected" : ""}
            key={c}
            to={"/study?cycle=" + c}
          >
            {c} ·{" "}
            {
              p.documents.filter(
                (d) => d.cycle === c && d.status === "completed",
              ).length
            }{" "}
            completed
          </Link>
        ))}
      </div>
      {!cycles.length ? (
        <p>
          No cycles generated yet.{" "}
          <Link to="/agents?workflow=cycle">Generate a cycle</Link>
        </p>
      ) : (
        <>
          <div className="section-heading">
            <h2>{selected}</h2>
            <Link to={docLink(`study-plans/${selected}/overview.md`)}>
              Cycle overview →
            </Link>
          </div>
          <p>
            {sessions.filter((d) => d.status === "completed").length} of{" "}
            {sessions.length} sessions completed ·{" "}
            {selected === p.activeCycle ? p.cycleStatus : "Historical cycle"}
          </p>
          {[...new Set(sessions.map((d) => d.week))].map((week) => (
            <section className="week" id={week} key={week}>
              <h2>{week?.replace("-", " ")}</h2>
              <div className="lesson-grid">
                {sessions
                  .filter((d) => d.week === week)
                  .map((d) => (
                    <Link
                      className={
                        "lesson-card " + (d.id?.includes("-R") ? "review" : "")
                      }
                      key={d.path}
                      to={docLink(d.path)}
                    >
                      <div>
                        <span className="eyebrow">{d.id}</span>
                        <span className="status">{d.status}</span>
                      </div>
                      <h3>{d.title.replace(/^C\d+-[LR]\d+\s*[—–-]\s*/, "")}</h3>
                      <span className="muted small">
                        Study session ·{" "}
                        {d.id?.includes("-R")
                          ? "Reflect & consolidate"
                          : "Integrated practice"}{" "}
                        →
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
