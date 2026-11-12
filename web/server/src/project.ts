import { Files, hash, AppError } from "./files.js";
import type { Project, Unit, ProgressStatus } from "../../shared/types.js";
import { readPreferences, batchCounts } from "./preferences.js";
export function field(text: string, name: string) {
  return (
    text
      .split("\n")
      .find((l) => l.startsWith(`- **${name}:**`))
      ?.split("**")
      .slice(2)
      .join("**")
      .trim() || ""
  );
}
export function setField(text: string, name: string, value: string) {
  const prefix = `- **${name}:**`;
  const lines = text.split("\n");
  const n = lines.findIndex((l) => l.startsWith(prefix));
  if (n < 0)
    throw new AppError(
      409,
      `State format requires manual repair: missing ${name}`,
    );
  lines[n] = `${prefix} ${value}`;
  return lines.join("\n");
}
export function parseUnits(text: string): Unit[] {
  return [
    ...text.matchAll(
      /^### (U-\d+)\s+[—–-]\s+(.+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm,
    ),
  ].map((m) => ({
    id: m[1],
    title: m[2],
    phase: m[3].match(/phase \/ domains:\*\*\s*(\w+)/)?.[1] || "Other",
    content: `### ${m[1]} — ${m[2]}\n${m[3]}`,
  }));
}
export async function project(files: Files): Promise<Project> {
  const documents = await files.list();
  const get = async (p: string) =>
    files
      .read(p)
      .then((d) => d.content)
      .catch(() => "");
  const [current, record, master, priorities, ledger] = await Promise.all(
    [
      "state/current-cycle.md",
      "state/learning-record.md",
      "curriculum/master-curriculum.md",
      "state/recurring-mistakes.md",
      "state/cycle-ledger.md",
    ].map(get),
  );
  const activeCycle = field(current, "Active cycle");
  const done: string[] =
    (
      field(current, "Completed lesson IDs in active cycle") +
      " " +
      field(current, "Completed weekly review IDs in active cycle")
    ).match(/C\d+-[LR]\d+/g) || [];
  const statuses = new Map<string, ProgressStatus>();
  for (const m of record.matchAll(
    /^- \*\*Session status:\*\* (C\d+-[LR]\d+) = (not-started|in-progress|completed)$/gm,
  ))
    statuses.set(m[1], m[2] as ProgressStatus);
  for (const d of documents)
    if (d.id)
      d.status =
        d.cycle === activeCycle
          ? done.includes(d.id)
            ? "completed"
            : statuses.get(d.id) === "in-progress"
              ? "in-progress"
              : "not-started"
          : statuses.get(d.id) || "not-started";
  return {
    preferences: (await readPreferences(files)).preferences,
    documents,
    units: parseUnits(master),
    phases: [...master.matchAll(/^\| (P\d+): ([^|]+)\|/gm)].map((m) => ({
      id: m[1],
      title: m[2].trim(),
    })),
    activeCycle,
    cycleStatus: field(current, "Status"),
    revision: hash(
      current +
        record +
        master +
        priorities +
        ledger +
        JSON.stringify(documents),
    ),
    priorities,
    recent: record.slice(-12000),
    warnings: master
      ? []
      : ["Master curriculum is missing. Initialize it through AI Agents."],
  };
}
export async function recordProgress(
  files: Files,
  input: {
    id: string;
    status: ProgressStatus;
    observation: string;
    grammar: string;
    expressions: string;
    speaking: string;
    writing: string;
    review: string;
    extraTime: string;
  },
) {
  await files.assertRecovered();
  const p = await project(files);
  const lesson = p.documents.find((d) => d.id === input.id);
  if (!lesson) throw new AppError(404, "Lesson or review not found");
  if (lesson.cycle !== p.activeCycle)
    throw new AppError(
      409,
      "Record historical-cycle changes through workflow 03 to reconcile its ledger.",
    );
  const paths = [
    "state/current-cycle.md",
    "state/learning-record.md",
    "state/cycle-ledger.md",
  ];
  const [current, record, ledger] = await Promise.all(
    paths.map((x) => files.read(x)),
  );
  const sessions = p.documents.filter((d) => d.cycle === p.activeCycle && d.id);
  for (const s of sessions) if (s.id === input.id) s.status = input.status;
  const completed = sessions.filter((s) => s.status === "completed");
  const lessons = completed.filter((s) => s.id!.includes("-L"));
  const reviews = completed.filter((s) => s.id!.includes("-R"));
  const expected = await batchCounts(files, p.activeCycle);
  const status =
    lessons.length === expected.lessons &&
    reviews.length === expected.reviews &&
    completed.length === sessions.length
      ? "completed"
      : sessions.some((s) => s.status !== "not-started")
        ? "in-progress"
        : "planned";
  let next = current.content;
  for (const [key, value] of Object.entries({
    Status: status,
    "Completed lesson IDs in active cycle":
      lessons.map((s) => s.id).join(", ") || "none reported",
    "Completed weekly review IDs in active cycle":
      reviews.map((s) => s.id).join(", ") || "none reported",
    "Unfinished lessons":
      sessions
        .filter((s) => s.id!.includes("-L") && s.status !== "completed")
        .map((s) => s.id)
        .join(", ") || "none",
    "Unfinished weekly reviews":
      sessions
        .filter((s) => s.id!.includes("-R") && s.status !== "completed")
        .map((s) => s.id)
        .join(", ") || "none",
    "Next action":
      status === "completed"
        ? "Review the completed cycle through workflow 04."
        : "Continue the next unfinished session; completion is not mastery.",
  }))
    next = setField(next, key, value);
  if (status === "completed")
    next = setField(next, "Last completed cycle", p.activeCycle);
  const date = new Date().toISOString();
  const clean = (s: string) => s.replace(/\r?\n/g, " / ");
  const entry =
    `\n## ${date} — Learning entry\n\n- **Cycle/lesson IDs:** ${p.activeCycle} / ${input.id}\n- **Evidence type:** self-reported\n- **Session status:** ${input.id} = ${input.status}\n- **Completed:** ${input.status === "completed" ? input.id : "No new completion reported"}\n` +
    Object.entries(input)
      .filter(([k]) => !["id", "status"].includes(k))
      .map(([k, v]) => `- **${k}:** ${clean(v) || "not reported"}`)
      .join("\n") +
    "\n- **Mastery:** not assessed\n";
  const row = `\n| ${p.activeCycle} | [Overview](../study-plans/${p.activeCycle}/overview.md) | ${date.slice(0, 10)} | ${status} | ${lessons.length} | ${reviews.length} | — | Learner self-report; ${input.id}: ${input.status}. |\n`;
  // Journal before the multi-file operation. A failure retains originals for manual recovery.
  const journal = ".english-web/progress-pending.json";
  let existing;
  try {
    existing = await files.read(journal, true);
  } catch {}
  if (existing)
    throw new AppError(
      409,
      "An interrupted progress update needs recovery; see web/docs/architecture.md",
    );
  await files.write(
    journal,
    JSON.stringify({
      paths,
      originals: [current, record, ledger],
      proposed: [next, record.content + entry, ledger.content + row],
    }),
    null,
    true,
  );
  for (const [i, doc] of [current, record, ledger].entries())
    await files.write(
      paths[i],
      [next, record.content + entry, ledger.content + row][i],
      doc.hash,
      true,
    );
  const { unlink } = await import("node:fs/promises");
  await unlink(await files.safe(journal, true));
  return project(files);
}
