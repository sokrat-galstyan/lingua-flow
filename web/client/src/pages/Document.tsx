import { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { api, docLink } from "../api";
import { Markdown } from "../Markdown";
import { ProgressForm } from "../components/ProgressForm";
import type { Project } from "../../../shared/types";
export function Document({
  fixed,
  p,
  refresh,
}: {
  fixed?: string;
  p: Project;
  refresh: () => void;
}) {
  const [params] = useSearchParams();
  const path = fixed || params.get("path") || "";
  const [doc, setDoc] = useState<any>();
  const [error, setError] = useState("");
  const location = useLocation();
  useEffect(() => {
    setError("");
    api("documents?path=" + encodeURIComponent(path))
      .then(setDoc)
      .catch((e) => {
        setDoc(null);
        setError(e.message);
      });
  }, [path, p.revision]);
  useEffect(() => {
    if (doc && location.hash)
      setTimeout(
        () =>
          document
            .getElementById(decodeURIComponent(location.hash.slice(1)))
            ?.scrollIntoView(),
        50,
      );
  }, [doc, location.hash]);
  const meta = p.documents.find((d) => d.path === path);
  const siblings = p.documents.filter((d) => d.cycle === meta?.cycle && d.id);
  const index = siblings.findIndex((d) => d.path === path);
  if (error)
    return (
      <p className="alert">
        Unable to open this link: {error}.{" "}
        <Link to="/search">Search materials</Link>
      </p>
    );
  if (!doc) return <p>Opening document…</p>;
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Home</Link> /{" "}
        {meta?.cycle && (
          <Link to={"/study?cycle=" + meta.cycle}>{meta.cycle}</Link>
        )}{" "}
        /{" "}
        {meta?.week && (
          <Link to={"/study?cycle=" + meta.cycle + "#" + meta.week}>
            {meta.week}
          </Link>
        )}{" "}
        / {meta?.id || "Document"}
      </div>
      <div className="document-layout">
        <article className="card document">
          <div className="section-heading">
            <span className="pill">
              {doc.editable ? "Your workspace" : "Reading view"}
            </span>
            {doc.editable && (
              <Link to={"/workspace?path=" + encodeURIComponent(path)}>
                Edit document →
              </Link>
            )}
          </div>
          {meta?.id && (
            <div className="lesson-actions">
              <ProgressForm p={p} refresh={refresh} fixed={meta.id} />
              <Link to={"/workspace?kind=notes&new=1&association=" + meta.id}>
                Add note
              </Link>
              <Link to={"/workspace?kind=writing&new=1&association=" + meta.id}>
                Writing exercise
              </Link>
              <Link
                to={
                  "/agents?workflow=explain&context=" + encodeURIComponent(path)
                }
              >
                AI explanation / practice
              </Link>
            </div>
          )}
          <Markdown text={doc.content} path={path} />
          <div className="section-heading">
            {siblings[index - 1] && (
              <Link to={docLink(siblings[index - 1].path)}>
                ← Previous session
              </Link>
            )}
            {siblings[index + 1] && (
              <Link to={docLink(siblings[index + 1].path)}>Next session →</Link>
            )}
          </div>
        </article>
        <aside className="context">
          <details open>
            <summary>On this page</summary>
            {[...doc.content.matchAll(/^#{2,3} (.+)$/gm)].map(
              (m: any, i: number) => (
                <a
                  key={i}
                  href={
                    "#" +
                    m[1]
                      .toLowerCase()
                      .replace(/[^\p{L}\p{N} _-]/gu, "")
                      .replace(/ /g, "-")
                  }
                >
                  {m[1]}
                </a>
              ),
            )}
          </details>
          {meta?.units.length ? (
            <details open>
              <summary>Connected units</summary>
              {meta.units.map((id) => (
                <Link
                  key={id}
                  to={
                    docLink("curriculum/master-curriculum.md") +
                    "#" +
                    id.toLowerCase()
                  }
                >
                  {id}
                </Link>
              ))}
            </details>
          ) : null}
          {meta?.id && (
            <details open>
              <summary>Your related notes</summary>
              {p.documents
                .filter(
                  (d) => d.category === "learner" && d.path.includes(meta.id!),
                )
                .map((d) => (
                  <Link key={d.path} to={docLink(d.path)}>
                    {d.title}
                  </Link>
                ))}
            </details>
          )}
        </aside>
      </div>
    </>
  );
}
