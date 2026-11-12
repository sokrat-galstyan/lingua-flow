import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Markdown } from "../Markdown";
import type { Project } from "../../../shared/types";
import { Title } from "../components/Title";
export function Workspace({ p, refresh }: { p: Project; refresh: () => void }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const kind = params.get("kind") || "notes";
  const selected = params.get("path");
  const creating = params.has("new");
  const [path, setPath] = useState("");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("split");
  const [busy, setBusy] = useState(false);
  const dirty = text !== saved;
  const external = p.documents.find((d) => d.path === selected);
  useEffect(() => {
    setMessage("");
    if (selected)
      api("documents?path=" + encodeURIComponent(selected))
        .then((d) => {
          if (!d.editable) throw new Error("This document is read-only");
          setPath(d.path);
          setText(d.content);
          setSaved(d.content);
          setHash(d.hash);
        })
        .catch((e) => setMessage(e.message));
    else {
      setPath(
        `practice/${kind}/${params.get("association") ? params.get("association") + "-" : ""}my-note.md`,
      );
      setText("# My note\n\n");
      setSaved("# My note\n\n");
      setHash(null);
    }
  }, [selected, kind, creating, params]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      if (
        dirty &&
        (e.target as HTMLElement).closest("a") &&
        !confirm("Discard unsaved changes?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", handler);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  const save = async () => {
    setBusy(true);
    try {
      const d = await api("documents", { path, content: text, hash }, "PUT");
      setHash(d.hash);
      setSaved(text);
      setMessage("Saved to your project.");
      refresh();
      navigate("/workspace?path=" + encodeURIComponent(path));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Title
        eyebrow="YOUR WORDS, YOUR WORKSPACE"
        title={
          selected
            ? "Keep your thoughts growing."
            : kind === "writing"
              ? "A space to find your voice."
              : kind === "vocabulary"
                ? "Words worth keeping."
                : "Your personal notebook."
        }
      />
      <div className="workspace-layout">
        <section className="card file-list">
          <Link
            className="button primary"
            to={"/workspace?kind=" + kind + "&new=1"}
          >
            + New document
          </Link>
          {p.documents
            .filter(
              (d) =>
                d.category === "learner" &&
                (selected || d.path.startsWith("practice/" + kind + "/")),
            )
            .map((d) => (
              <Link
                key={d.path}
                to={"/workspace?path=" + encodeURIComponent(d.path)}
              >
                {d.title}
              </Link>
            ))}
        </section>
        {selected || creating ? (
          <section className="card editor">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                  e.preventDefault();
                  void save();
                }
              }}
            >
              <label>
                Document path · include a lesson, unit, or topic if useful
                <input
                  value={path}
                  disabled={!!selected}
                  onChange={(e) => setPath(e.target.value)}
                  required
                  pattern="practice/.+\.md"
                />
              </label>
              <div className="toolbar">
                <span>{dirty ? "● Unsaved changes" : "Saved version"}</span>
                <select
                  aria-label="Editor mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="split">Edit + preview</option>
                  <option value="edit">Edit</option>
                  <option value="preview">Preview</option>
                </select>
                {[
                  ["Heading", "\n## Heading\n"],
                  ["Bold", "**text**"],
                  ["List", "\n- Item\n"],
                  ["Link", "[label](https://example.com)"],
                ].map(([label, value]) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => setText(text + value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={"editor-panes " + mode}>
                {mode !== "preview" && (
                  <textarea
                    aria-label="Markdown content"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck
                  />
                )}
                {mode !== "edit" && <Markdown text={text} path={path} />}
              </div>
              <div className="toolbar">
                <button className="primary" disabled={busy}>
                  Save document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText(saved);
                    setMessage("Changes canceled");
                  }}
                >
                  Cancel changes
                </button>
                {selected && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const to = prompt(
                          "New path in practice/ ending in .md",
                          path,
                        );
                        if (!to) return;
                        try {
                          const d = await api("documents/rename", {
                            path,
                            to,
                            hash,
                          });
                          refresh();
                          navigate(
                            "/workspace?path=" + encodeURIComponent(d.path),
                          );
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={async () => {
                        if (!confirm("Move this document to local trash?"))
                          return;
                        try {
                          await api("documents", { path, hash }, "DELETE");
                          refresh();
                          navigate("/workspace?kind=" + kind);
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      Move to trash
                    </button>
                  </>
                )}
              </div>
              <p role="status">{message}</p>
              {selected && (
                <Link
                  to={
                    "/agents?workflow=writing&context=" +
                    encodeURIComponent(path)
                  }
                >
                  Request AI feedback →
                </Link>
              )}
              <p className="small muted">
                Ctrl/⌘ S to save. External changes are checked on every save.{" "}
                {external?.title}
              </p>
            </form>
          </section>
        ) : (
          <section className="card empty">
            <h2>A thought worth keeping?</h2>
            <p>Create a note, draft, reflection, or vocabulary collection.</p>
          </section>
        )}
      </div>
    </>
  );
}
