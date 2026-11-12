import { AppError, Files, hash } from "../files.js";
import { promises as fs } from "node:fs";
import { readPreferences, planText } from "../preferences.js";
import { project } from "../project.js";
export const workflows = [
  { id: "ask", title: "Ask about your learning", mutating: false },
  { id: "explain", title: "Explain a lesson", mutating: false },
  { id: "review", title: "Review learning progress", mutating: false },
  { id: "writing", title: "Analyze writing", mutating: false },
  { id: "practice", title: "Generate additional practice", mutating: true },
  { id: "cycle", title: "Generate lessons", mutating: true },
  { id: "initialize", title: "Generate master curriculum", mutating: true },
];
export async function preflight(
  files: Files,
  workflow: string,
  lessonCount?: number,
) {
  const p = await project(files);
  const { preferences } = await readPreferences(files);
  const count = lessonCount ?? preferences?.defaultLessonCount ?? 20;
  if (!Number.isInteger(count) || count < 1 || count > 40)
    throw new AppError(400, "Choose 1–40 lessons.");
  const plan = planText(
    count,
    preferences?.lessonMinutes ?? 120,
    preferences?.includeReviews ?? true,
  );
  const entries = await fs.readdir(await files.safe("study-plans", true), {
    withFileTypes: true,
  });
  const ids = entries
    .filter((e) => e.isDirectory() && /^cycle-\d+$/.test(e.name))
    .map((e) => e.name);
  const ledger = (await files.read("state/cycle-ledger.md")).content;
  const draft = ids.find((id) => !ledger.includes("| " + id + " |"));
  const next = String(
    Math.max(0, ...ids.map((id) => Number(id.split("-")[1]))) + 1,
  ).padStart(3, "0");
  const unfinished = p.documents
    .filter(
      (d) => d.cycle === p.activeCycle && d.id && d.status !== "completed",
    )
    .map((d) => d.id);
  const existing = p.documents.some(
    (d) => d.path === "curriculum/master-curriculum.md",
  );
  const override =
    workflow === "cycle" &&
    !!p.activeCycle &&
    p.activeCycle !== "none" &&
    p.cycleStatus !== "completed";
  return {
    workflow,
    plan,
    next,
    unfinished,
    override,
    blocked:
      ["initialize", "cycle"].includes(workflow) && !preferences
        ? "Complete learning customization first."
        : workflow === "cycle" && draft
          ? `Existing ${draft} is not registered in the ledger. Repair or validate this draft before generating another cycle.`
          : workflow === "cycle" && (!p.activeCycle || !p.cycleStatus)
            ? "Active-cycle state is malformed; repair it through the project workflow."
            : workflow === "initialize" && existing
              ? "Curriculum already exists. Regeneration requires a named revision through the terminal workflow."
              : workflow === "cycle" && !existing
                ? "Initialize the master curriculum first."
                : "",
    summary:
      workflow === "cycle"
        ? `Create cycle-${next}: ${count} lessons and ${(preferences?.includeReviews ?? true) ? Math.ceil(count / 5) : 0} reviews, ${preferences?.lessonMinutes ?? 120} minutes per session; preserve all previous cycles. ${unfinished.length} unfinished sessions.`
        : workflows.find((w) => w.id === workflow)?.title || "",
    token: hash(p.revision + workflow + next + ids.join(",") + plan),
  };
}
export async function promptFor(
  files: Files,
  input: {
    workflow: string;
    prompt: string;
    context?: string;
    override?: boolean;
  },
  next: string,
) {
  let context = "";
  if (input.context)
    context = `\nSelected document: ${input.context}\n${(await files.read(input.context)).content}`;
  const instructions: Record<string, string> = {
    ask: "Answer the learner. Do not modify files.",
    explain: "Explain the selected lesson. Do not modify files.",
    review:
      "Read workflows/04-review-cycle.md and all state. Provide its analysis only; do not modify records or curriculum.",
    writing:
      "Analyze the writing. Separate grammatical errors, naturalness improvements and optional style changes. Preserve the original; respond with feedback only.",
    practice:
      "Create optional original practice only in a NEW Markdown file under practice/generated/. Never replace learner artifacts.",
    cycle: `Follow workflows/02-generate-next-cycle.md. Generate ONLY cycle-${next}, one week at a time; follow the immutable plan.md in that cycle directory and validate every requested session. ${input.override ? "Learner explicitly overrides unfinished-cycle guard. Document every carried-over unfinished session." : "Do not skip unfinished work."}`,
    initialize:
      "Follow workflows/01-initialize.md; initialize missing curriculum without generating lessons.",
  };
  if (!instructions[input.workflow])
    throw new AppError(400, "Unknown workflow");
  return `Read AGENTS.md and the project contract first. ${instructions[input.workflow]}\nUser instruction: ${input.prompt}${context}`;
}
