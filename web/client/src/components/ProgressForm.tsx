import { useState, useEffect } from "react";
import type { Project, ProgressStatus } from "../../../shared/types";
import { api } from "../api";
export function ProgressForm({
  p,
  refresh,
  fixed,
}: {
  p: Project;
  refresh: () => void;
  fixed?: string;
}) {
  const [id, setId] = useState(fixed || "");
  const [status, setStatus] = useState<ProgressStatus>("in-progress");
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (fixed) setId(fixed);
  }, [fixed]);
  return (
    <details className="progress-form">
      <summary>
        {fixed
          ? "Record session progress / difficulty"
          : "Record learning progress"}
      </summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("progress", { id, status, ...values });
            setMessage("Recorded your self-report. No mastery inferred.");
            refresh();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!fixed && (
          <label>
            Session
            <select value={id} onChange={(e) => setId(e.target.value)} required>
              <option value="">Choose a session</option>
              {p.documents
                .filter((d) => d.cycle === p.activeCycle && d.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Status
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProgressStatus)}
          >
            <option value="not-started">Not started (correction)</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed — I confirm</option>
          </select>
        </label>
        {Object.entries({
          observation: "What was difficult?",
          grammar: "Grammar observation",
          expressions: "Expressions to revisit",
          speaking: "Speaking observation",
          writing: "Writing observation",
          extraTime: "Additional time needed",
          review: "Review requested",
        }).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              value={values[key] || ""}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          </label>
        ))}
        <button disabled={busy} className="primary">
          Save progress
        </button>
        <p role="status">{message}</p>
      </form>
    </details>
  );
}
