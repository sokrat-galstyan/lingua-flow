import { Link } from "react-router-dom";
import { docLink } from "../api";
import { Markdown } from "../Markdown";
import { ProgressForm } from "../components/ProgressForm";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Progress({ p, refresh }: { p: Project; refresh: () => void }) {
  return (
    <>
      <Title
        eyebrow="EVIDENCE, NOT ASSUMPTIONS"
        title="Your progress journal"
      />
      <ProgressForm p={p} refresh={refresh} />
      <section className="card">
        <Markdown text={p.recent} path="state/learning-record.md" />
        <Link to={docLink("state/cycle-ledger.md")}>Full cycle ledger →</Link>
      </section>
    </>
  );
}
