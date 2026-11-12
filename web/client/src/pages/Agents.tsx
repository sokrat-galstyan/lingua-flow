import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  ProviderStatus,
  Session,
  AgentEvent,
} from "../../../shared/types";
import { api } from "../api";
import { Markdown } from "../Markdown";
export function Agents({ refresh }: { refresh: () => void }) {
  const [params] = useSearchParams();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [provider, setProvider] = useState("codex");
  const [workflow, setWorkflow] = useState(params.get("workflow") || "ask");
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [session, setSession] = useState<Session>();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [lessonCount, setLessonCount] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any>();
  const [override, setOverride] = useState(false);
  const [changes, setChanges] = useState<any[]>();
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState(false);
  const load = () => {
    api<Session[]>("agents/sessions")
      .then(setHistory)
      .catch((e) => setError(e.message));
  };
  useEffect(() => {
    api<ProviderStatus[]>("agents/providers")
      .then(setProviders)
      .catch((e) => setError(e.message));
    api<any[]>("agents/workflows")
      .then(setWorkflows)
      .catch((e) => setError(e.message));
    load();
    api("preferences")
      .then((d) => setLessonCount(d.preferences?.defaultLessonCount || 1))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!session) return;
    setEvents(session.events);
    const source = new EventSource(`/api/agents/sessions/${session.id}/events`);
    source.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setEvents((old) =>
        old.some((x) => x.seq === event.seq) ? old : [...old, event],
      );
    };
    source.addEventListener("status", (e) => {
      const status = JSON.parse((e as MessageEvent).data).status;
      setSession((old) => (old ? { ...old, status } : old));
      if (status !== "running") {
        source.close();
        load();
        refresh();
      }
    });
    source.onerror = () => {
      setError("Live connection interrupted. Reopen the session to reconnect.");
      source.close();
    };
    return () => source.close();
  }, [session?.id]);
  const selected = providers.find((p) => p.id === provider);
  const mutation = workflows.find((w) => w.id === workflow)?.mutating;
  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await api<Session>("agents/sessions", {
        provider,
        workflow,
        lessonCount: workflow === "cycle" ? lessonCount : undefined,
        prompt:
          prompt ||
          workflows.find((w) => w.id === workflow)?.title ||
          "Help me study my target language.",
        context: params.get("context") || undefined,
        token: preview?.token,
        override,
        resume: resume ? session?.id : undefined,
      });
      setSession(s);
      setChanges(undefined);
      setPreview(undefined);
      setPrompt("");
      setResume(false);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="page-title">
        <p className="eyebrow">A LITTLE HELP WHEN YOU NEED IT</p>
        <h1>Your AI study assistant</h1>
        <p className="muted">
          Real local agents. You choose the task and review the results.
        </p>
      </div>
      <div className="agent-layout">
        <aside className="card agent-sidebar">
          <h2>Choose an agent</h2>
          {providers.map((p) => (
            <button
              className={"provider " + (provider === p.id ? "selected" : "")}
              disabled={!p.available}
              key={p.id}
              onClick={() => {
                setProvider(p.id);
                setResume(false);
              }}
            >
              <strong>{p.name}</strong>
              <span>
                {p.available
                  ? "Available"
                  : p.installed
                    ? "Unavailable"
                    : "Not installed"}
              </span>
              <small>
                {p.version} · {p.authentication}
              </small>
              <small>{p.reason}</small>
            </button>
          ))}
          <h3>Saved workflows</h3>
          <select
            aria-label="Workflow"
            value={workflow}
            onChange={(e) => {
              setWorkflow(e.target.value);
              setPreview(undefined);
              setResume(false);
            }}
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
          {workflow === "cycle" && (
            <label>
              Lessons to generate
              <input
                type="number"
                min={1}
                max={40}
                required
                value={lessonCount}
                onChange={(e) => {
                  setLessonCount(Number(e.target.value));
                  setPreview(undefined);
                }}
              />
            </label>
          )}
          <button
            onClick={() => {
              setSession(undefined);
              setEvents([]);
              setChanges(undefined);
              setResume(false);
            }}
          >
            + New conversation
          </button>
          <h3>Session history</h3>
          {history.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSession(s);
                setChanges(undefined);
                setProvider(s.provider);
                setResume(false);
              }}
            >
              {s.workflow} · {s.provider}
              <small>
                {new Date(s.created).toLocaleString()} · {s.status}
              </small>
            </button>
          ))}
        </aside>
        <section className="card conversation">
          <div className="section-heading">
            <h2>{selected?.name || "Select a provider"}</h2>
            <span className="pill" role="status">
              {session?.status || "Ready"}
            </span>
          </div>
          <p className="small muted">
            {mutation
              ? "Changes are prepared in a staging copy, validated, and reviewed before import."
              : "Read-only task: your educational records will not be changed."}{" "}
            Interactive tool approvals are not supported in this release.
          </p>
          {params.get("context") && (
            <p>
              Context: <code>{params.get("context")}</code>
            </p>
          )}
          <div className="messages" aria-live="polite">
            {events.length ? (
              events.map((e) => (
                <div className={"message " + e.type} key={e.seq}>
                  <span className="eyebrow">{e.type}</span>
                  {["response", "user", "result"].includes(e.type) ? (
                    <Markdown text={e.text} />
                  ) : (
                    <details>
                      <summary>{e.text.slice(0, 100)}</summary>
                      <pre>{e.text}</pre>
                    </details>
                  )}
                </div>
              ))
            ) : (
              <div className="empty">
                <span className="assistant-orb">✧</span>
                <h2>Keep the learning yours.</h2>
                <p>
                  Ask for an explanation, get feedback on a draft,
                  <br />
                  or build your next learning cycle.
                </p>
              </div>
            )}
          </div>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
          {session?.status === "running" && (
            <button
              className="danger"
              onClick={() =>
                api(`agents/sessions/${session.id}/cancel`, {}).catch((e) =>
                  setError(e.message),
                )
              }
            >
              Stop execution
            </button>
          )}
          {session?.status === "review" && (
            <div className="review-actions">
              <button
                onClick={() =>
                  api(`agents/sessions/${session.id}/changes`)
                    .then(setChanges)
                    .catch((e) => setError(e.message))
                }
              >
                Inspect proposed file changes
              </button>
              <button
                onClick={async () => {
                  try {
                    setSession(
                      await api(`agents/sessions/${session.id}/cancel`, {}),
                    );
                    load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Discard proposal
              </button>
              {changes && (
                <>
                  <p>
                    {changes.length} files proposed. Protected changes cannot be
                    imported.
                  </p>
                  {changes.map((c) => (
                    <details key={c.path}>
                      <summary>
                        {c.path} · {c.allowed ? "Allowed" : "BLOCKED"}
                      </summary>
                      <div className="diff">
                        <div>
                          <h3>Current</h3>
                          <pre>{c.before || "(new file)"}</pre>
                        </div>
                        <div>
                          <h3>Proposed</h3>
                          <pre>{c.after}</pre>
                        </div>
                      </div>
                    </details>
                  ))}
                  <button
                    className="primary"
                    disabled={changes.some((c) => !c.allowed)}
                    onClick={async () => {
                      if (
                        !confirm(
                          "Import these validated file changes into the project?",
                        )
                      )
                        return;
                      try {
                        setSession(
                          await api(`agents/sessions/${session.id}/apply`, {}),
                        );
                        refresh();
                        load();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Import reviewed changes
                  </button>
                </>
              )}
            </div>
          )}
          {session &&
            !session.mutating &&
            session.providerSessionId &&
            session.status !== "running" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={resume}
                  onChange={(e) => setResume(e.target.checked)}
                />
                Continue this conversation
              </label>
            )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (mutation) {
                try {
                  setPreview(
                    await api(
                      "agents/preflight?workflow=" +
                        workflow +
                        (workflow === "cycle"
                          ? "&lessonCount=" + lessonCount
                          : ""),
                    ),
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              } else await start();
            }}
          >
            <label htmlFor="prompt">Your instructions</label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Explain this idea, help me practice, or review my writing…"
            />
            <button
              className="primary"
              disabled={
                busy ||
                session?.status === "running" ||
                !selected?.available ||
                (!mutation && !selected?.capabilities.readOnly)
              }
            >
              {mutation ? "Preview workflow" : "Send instructions"} →
            </button>
          </form>
          {preview && (
            <section className="confirm-panel">
              <h3>Confirm the operation</h3>
              <p>{preview.summary}</p>
              {preview.blocked && <p className="alert">{preview.blocked}</p>}
              {preview.override && (
                <>
                  <p>
                    Unfinished:{" "}
                    {preview.unfinished.join(", ") || "See current cycle state"}
                  </p>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={override}
                      onChange={(e) => setOverride(e.target.checked)}
                    />
                    I explicitly authorize early generation and carrying over
                    unfinished work.
                  </label>
                </>
              )}
              <button
                disabled={
                  busy || !!preview.blocked || (preview.override && !override)
                }
                className="primary"
                onClick={start}
              >
                Confirm and run
              </button>
              <button onClick={() => setPreview(undefined)}>Cancel</button>
            </section>
          )}
        </section>
      </div>
    </>
  );
}
