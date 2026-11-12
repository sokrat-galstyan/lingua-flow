import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  defaultPreferences,
  type Preferences,
} from "../../../shared/preferences";
export function Customize({ refresh }: { refresh: () => void }) {
  const [value, setValue] = useState<Preferences>(defaultPreferences);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    api("preferences")
      .then((d) => {
        setValue(d.preferences || defaultPreferences);
        setHash(d.hash);
      })
      .catch((e) => setError(e.message));
  }, []);
  function update<K extends keyof Preferences>(key: K, next: Preferences[K]) {
    setValue((v) => ({ ...v, [key]: next }));
  }
  return (
    <section className="card customization">
      <p className="eyebrow">YOUR LEARNING, YOUR PLAN</p>
      <h1>Build your learning path</h1>
      <p>
        Choose your goals and available time. AI will use these preferences to
        build a curriculum strategy before generating lessons.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError("");
          try {
            const saved = await api(
              "preferences",
              { preferences: value, hash },
              "PUT",
            );
            setHash(saved.hash);
            refresh();
            const p = await api("project");
            navigate(
              p.documents.some(
                (d: { path: string }) =>
                  d.path === "curriculum/master-curriculum.md",
              )
                ? "/curriculum"
                : "/agents?workflow=initialize",
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="customization-grid">
          <label>
            Language to learn
            <input
              required
              maxLength={100}
              value={value.targetLanguage}
              onChange={(e) => update("targetLanguage", e.target.value)}
            />
          </label>
          <label>
            Primary language (optional)
            <input
              maxLength={100}
              value={value.primaryLanguage}
              onChange={(e) => update("primaryLanguage", e.target.value)}
            />
          </label>
          <label>
            Current level — self-reported
            <select
              value={value.level}
              onChange={(e) =>
                update("level", e.target.value as Preferences["level"])
              }
            >
              {["unknown", "A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                <option key={l} value={l}>
                  {l === "unknown" ? "I’m not sure" : l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resource budget
            <select
              value={value.budget}
              onChange={(e) =>
                update("budget", e.target.value as Preferences["budget"])
              }
            >
              <option value="free">Free resources</option>
              <option value="paid-optional">
                Optional paid resources with free alternatives
              </option>
            </select>
          </label>
        </div>
        <label>
          What do you want to achieve?
          <textarea
            required
            maxLength={2000}
            value={value.goals}
            onChange={(e) => update("goals", e.target.value)}
            placeholder="For example: feel comfortable in everyday conversations"
          />
        </label>
        <label>
          Weak points or skills to focus on (optional)
          <textarea
            maxLength={2000}
            value={value.weaknesses}
            onChange={(e) => update("weaknesses", e.target.value)}
            placeholder="Describe what feels difficult; leave blank if unsure"
          />
        </label>
        <label>
          Interests and useful contexts (optional)
          <textarea
            maxLength={2000}
            value={value.interests}
            onChange={(e) => update("interests", e.target.value)}
          />
        </label>
        <label>
          Preferences and access needs (optional)
          <textarea
            maxLength={2000}
            value={value.constraints}
            onChange={(e) => update("constraints", e.target.value)}
            placeholder="Learning formats, language variety, accessibility, equipment, or other constraints"
          />
        </label>
        <div className="customization-grid">
          <label>
            Minutes per session (60 = 1 hour)
            <input
              type="number"
              required
              min={10}
              max={240}
              value={value.lessonMinutes}
              onChange={(e) => update("lessonMinutes", Number(e.target.value))}
            />
          </label>
          <label>
            Study sessions per week
            <input
              type="number"
              required
              min={1}
              max={7}
              value={value.sessionsPerWeek}
              onChange={(e) =>
                update("sessionsPerWeek", Number(e.target.value))
              }
            />
          </label>
          <label>
            Default lessons per request
            <input
              type="number"
              required
              min={1}
              max={40}
              value={value.defaultLessonCount}
              onChange={(e) =>
                update("defaultLessonCount", Number(e.target.value))
              }
            />
          </label>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.includeReviews}
            onChange={(e) => update("includeReviews", e.target.checked)}
          />
          Add a review after each block of up to five lessons
        </label>
        <p className="muted">
          You can request one lesson or a batch each time. Preference changes
          affect future generation; an existing curriculum requires an explicit
          named revision to change its strategy.
        </p>
        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={!hash || saving}>
          {saving ? "Saving…" : "Save and continue"}
        </button>{" "}
        <Link to="/">Back to learning</Link>
      </form>
    </section>
  );
}
