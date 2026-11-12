import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import type { Project } from "../../shared/types";
import { api } from "./api";
import { Agents } from "./pages/Agents";
import "./styles.css";
import { Dashboard } from "./pages/Dashboard";
import { Study } from "./pages/Study";
import { Curriculum } from "./pages/Curriculum";
import { Document } from "./pages/Document";
import { Progress } from "./pages/Progress";
import { Mistakes } from "./pages/Mistakes";
import { Workspace } from "./pages/Workspace";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { Customize } from "./pages/Customize";
const navigation = [
  ["/", "Overview", "◉"],
  ["/study", "Study Plan", "▦"],
  ["/curriculum", "Curriculum", "▤"],
  ["/resources", "Resources", "↗"],
  ["/workspace?kind=notes", "My Notes", "✎"],
  ["/workspace?kind=writing", "Writing Practice", "▧"],
  ["/workspace?kind=vocabulary", "Vocabulary", "Aa"],
  ["/mistakes", "Grammar Mistakes", "↻"],
  ["/progress", "Progress", "◷"],
  ["/agents", "AI Agents", "✧"],
  ["/customize", "Customize learning", "✎"],
  ["/settings", "Settings", "⚙"],
];
export function App() {
  const [project, setProject] = useState<Project>();
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");
  const refresh = useCallback(() => {
    api<Project>("project")
      .then(setProject)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  const location = useLocation();
  useEffect(() => setMenu(false), [location]);
  return (
    <div className="app">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Link to="/" className="brand">
          <span className="brand-mark">lf.</span>
          <span>
            Lingua Flow<span className="brand-sub">YOUR STUDY ROOM</span>
          </span>
        </Link>
        <p className="eyebrow">LEARN AT YOUR OWN PACE</p>
        <nav>
          {navigation.map(([url, label, icon]) => (
            <NavLink
              key={label}
              to={url}
              end={url === "/"}
              className={({ isActive }) =>
                isActive &&
                (!url.includes("?") ||
                  location.search === url.slice(url.indexOf("?")))
                  ? "active"
                  : ""
              }
            >
              <span aria-hidden>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="dot" /> Local files, always yours
          <p>One lesson. A little more confidence.</p>
          <button onClick={() => setDark(!dark)}>
            {dark ? "☀ Light mode" : "☾ Dark mode"}
          </button>
        </div>
      </aside>
      <div className="shell">
        <header>
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span>
            My learning space{" "}
            <span className="muted">
              / {project?.preferences?.targetLanguage || "Learning"}
            </span>
          </span>
          <div>
            <Link to="/search">Search materials</Link>
            <button onClick={refresh} aria-label="Refresh project">
              ↻ Refresh
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div role="alert" className="alert">
              {error}
            </div>
          )}
          {!project ? (
            <p>Opening your study room…</p>
          ) : !project.preferences && location.pathname !== "/customize" ? (
            <Navigate to="/customize" replace />
          ) : (
            <Routes>
              <Route
                path="/customize"
                element={<Customize refresh={refresh} />}
              />
              <Route path="/" element={<Dashboard p={project} />} />
              <Route path="/study" element={<Study p={project} />} />
              <Route path="/curriculum" element={<Curriculum p={project} />} />
              <Route
                path="/resources"
                element={
                  <Document
                    fixed="curriculum/resources.md"
                    p={project}
                    refresh={refresh}
                  />
                }
              />
              <Route
                path="/document"
                element={<Document p={project} refresh={refresh} />}
              />
              <Route
                path="/workspace"
                element={<Workspace p={project} refresh={refresh} />}
              />
              <Route
                path="/progress"
                element={<Progress p={project} refresh={refresh} />}
              />
              <Route
                path="/mistakes"
                element={<Mistakes p={project} refresh={refresh} />}
              />
              <Route path="/agents" element={<Agents refresh={refresh} />} />
              <Route path="/search" element={<Search />} />
              <Route path="/settings" element={<Settings p={project} />} />
              <Route path="*" element={<h1>Page not found</h1>} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
