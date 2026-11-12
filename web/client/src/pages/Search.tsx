import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, docLink } from "../api";
import type { DocumentInfo } from "../../../shared/types";
import { Title } from "../components/Title";
export function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    (DocumentInfo & { snippet: string })[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api("search?q=" + encodeURIComponent(q))
        .then((r) => {
          if (active) setResults(r);
        })
        .catch((e) => setError(e.message));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);
  return (
    <>
      <Title eyebrow="FIND YOUR WAY" title="Search your learning space" />
      <input
        aria-label="Search"
        placeholder="A lesson, expression, or idea…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <p role="alert">{error}</p>
      {results.map((r) => (
        <Link className="card search-result" key={r.path} to={docLink(r.path)}>
          <h2>{r.title}</h2>
          <p>{r.snippet}</p>
          <small>{r.category}</small>
        </Link>
      ))}
    </>
  );
}
