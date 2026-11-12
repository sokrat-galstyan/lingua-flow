import { useState } from "react";
import { api } from "../api";
import { Markdown } from "../Markdown";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Mistakes({ p, refresh }: { p: Project; refresh: () => void }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <Title
        eyebrow="NOTICE · REPAIR · REVISIT"
        title="Make room for mistakes."
      />
      <details className="card">
        <summary>Record an example</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            try {
              await api("mistakes", Object.fromEntries(new FormData(form)));
              form.reset();
              setMessage("Example saved as learner-reported evidence.");
              refresh();
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          {["original", "corrected", "explanation", "topic", "lesson"].map(
            (name) => (
              <label key={name}>
                {name} {name === "original" ? "(required)" : "(optional)"}
                <input name={name} required={name === "original"} />
              </label>
            ),
          )}
          <label>
            Review status
            <select name="review">
              <option value="needs-review">Needs review</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </label>
          <button className="primary">Save example</button>
          <p role="status">{message}</p>
        </form>
      </details>
      <section className="card">
        <Markdown text={p.priorities} path="state/recurring-mistakes.md" />
      </section>
    </>
  );
}
