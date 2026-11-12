import { Link } from "react-router-dom";
import { docLink } from "../api";
import { Markdown } from "../Markdown";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Dashboard({ p }: { p: Project }) {
  const sessions = p.documents.filter((d) => d.id && d.cycle === p.activeCycle);
  const lessons = sessions.filter((d) => d.id!.includes("-L"));
  const reviews = sessions.filter((d) => d.id!.includes("-R"));
  const done = lessons.filter((d) => d.status === "completed").length;
  const rd = reviews.filter((d) => d.status === "completed").length;
  const next = sessions.find((d) => d.status !== "completed");
  return (
    <>
      <Title
        eyebrow="YOUR EVERYDAY LEARNING"
        title="A little practice. Lasting progress."
      >
        <p className="muted">
          Make room for {p.preferences?.targetLanguage || "learning"}. Your next step is right here.
        </p>
      </Title>
      {p.warnings.map((w) => (
        <p className="alert" key={w}>
          {w}
        </p>
      ))}
      <div className="dashboard-grid">
        <section className="hero">
          <span className="pill">
            {p.activeCycle || "No active cycle"} · {p.cycleStatus || "unknown"}
          </span>
          <p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>
          <h2>{next?.title || "Ready for your next chapter?"}</h2>
          <p>
            Read, listen, write, and speak.
            <br />A focused session built around meaningful communication.
          </p>
          {next ? (
            <Link className="button primary" to={docLink(next.path)}>
              Continue Learning <span>→</span>
            </Link>
          ) : (
            <Link className="button primary" to={p.units.length ? "/agents?workflow=cycle" : "/agents?workflow=initialize"}>
              {p.units.length ? "Generate lessons →" : "Generate curriculum →"}
            </Link>
          )}
          <div className="hero-footer">
            Session duration set in your plan <span>•</span> Self-study, at your pace
          </div>
        </section>
        <section className="card cycle-card">
          <p className="eyebrow">THIS CYCLE</p>
          <h2>Your steady progress</h2>
          <div className="big-number">
            {done}
            <span> / {lessons.length} lessons</span>
          </div>
          <progress value={done + rd} max={sessions.length || 1} />
          <div className="stats">
            <div>
              <strong>{lessons.length - done}</strong>
              <span>Lessons remaining</span>
            </div>
            <div>
              <strong>
                {rd} / {reviews.length}
              </strong>
              <span>Weekly reviews</span>
            </div>
          </div>
          <p className="muted small">
            Based only on your recorded work. Completion is separate from
            mastery.
          </p>
          <Link to="/study">Explore your study plan →</Link>
        </section>
      </div>
      <section className="quick-actions">
        <Link to="/workspace?kind=notes&new=1">
          ✎ <span>Create a note</span> +
        </Link>
        <Link to="/progress">
          ◷ <span>Record progress</span> →
        </Link>
        <Link to="/mistakes">
          ↻ <span>Review mistakes</span> →
        </Link>
        <Link to="/agents">
          ✧ <span>Ask an AI agent</span> →
        </Link>
      </section>
      <div className="dashboard-grid lower">
        <section className="card">
          <div className="section-heading">
            <h2>Learning priorities</h2>
            <Link to="/mistakes">View all →</Link>
          </div>
          <Markdown text={p.priorities.split("## Observed")[0]} />
        </section>
        <section className="card">
          <h2>Your learning journal</h2>
          <p className="muted">Recent evidence and reflections</p>
          <div className="journal-preview">
            <Markdown text={p.recent} />
          </div>
          <Link to="/progress">Open progress journal →</Link>
        </section>
      </div>
      <div className="next-cycle">
        <span>
          Looking ahead? Build the next chapter from your recorded progress.
        </span>
        <Link to={p.units.length ? "/agents?workflow=cycle" : "/agents?workflow=initialize"}>Generate next cycle →</Link>
      </div>
    </>
  );
}
