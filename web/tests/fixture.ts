import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultPreferences,
  formatPreferences,
} from "../shared/preferences.js";
export const source = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "language-fixture-"));
  for (const dir of ["docs", "workflows", "templates", "tools"])
    await fs.cp(path.join(source, dir), path.join(root, dir), {
      recursive: true,
    });
  for (const name of ["AGENTS.md", "README.md"])
    await fs.copyFile(path.join(source, name), path.join(root, name));
  await seed(root);
  return root;
}
export async function seed(root: string) {
  async function write(p: string, content: string) {
    await fs.mkdir(path.dirname(path.join(root, p)), { recursive: true });
    await fs.writeFile(path.join(root, p), content);
  }
  await write(
    "docs/LEARNER_PROFILE.md",
    formatPreferences({
      ...defaultPreferences,
      goals: "Synthetic test learning",
      defaultLessonCount: 20,
      lessonMinutes: 120,
      includeReviews: true,
    }),
  );
  await write("curriculum/README.md", "# Test curriculum");
  await write(
    "curriculum/resources.md",
    "# Test resources\nNo external sources.",
  );
  await write(
    "curriculum/master-curriculum.md",
    "# Synthetic curriculum\n\n" +
      Array.from(
        { length: 40 },
        (_, i) =>
          `### U-${String(i + 1).padStart(3, "0")} — Test unit ${i + 1}\n\n- **Developmental phase / domains:** P1\n\n`,
      ).join(""),
  );
  const links: string[] = [];
  for (let week = 1; week <= 4; week++) {
    for (let n = 1; n <= 6; n++) {
      const review = n === 6;
      const number = String(review ? week : (week - 1) * 5 + n).padStart(
        2,
        "0",
      );
      const p = `week-${String(week).padStart(2, "0")}/${review ? "review" : "lesson-" + number}.md`;
      links.push(`[Session](${p})`);
      await write(
        `study-plans/cycle-001/${p}`,
        `# C001-${review ? "R" : "L"}${number} — Synthetic session\n\nU-001\n\n## Objective\nTest-only material.\n## Resources\nOriginal exercise.\n<!-- ACTIVITY_TABLE_START -->\n| Step | Activity | Instructions | Resource | Minutes |\n|---|---|---|---|---|\n| 1 | Production | Write an example | Original | 120 |\n<!-- ACTIVITY_TABLE_END -->\n## Feedback\nSelf-check.\n## Review\nRecall.\n## Fluency\nRepeat.\n## Completion\nReport done.\n`,
      );
    }
  }
  await write(
    "study-plans/cycle-001/overview.md",
    "# Synthetic cycle\n" + links.join("\n"),
  );
  await write(
    "state/current-cycle.md",
    "# Test state\n" +
      Object.entries({
        "Active cycle": "cycle-001",
        Status: "planned",
        "Last generated cycle": "cycle-001",
        "Last completed cycle": "none",
        "Completed lesson IDs in active cycle": "none reported",
        "Completed weekly review IDs in active cycle": "none reported",
        "Unfinished lessons": "see overview",
        "Unfinished weekly reviews": "see overview",
        "Next action": "Study",
      })
        .map(([k, v]) => `- **${k}:** ${v}`)
        .join("\n"),
  );
  await write(
    "state/cycle-ledger.md",
    "# Test ledger\n| cycle-001 | overview | test | planned | 0 | 0 | — | Synthetic |\n",
  );
  await write("state/learning-record.md", "# Learning record\nNo evidence.");
  await write("state/recurring-mistakes.md", "# Mistakes\nNo evidence.");
  await fs.mkdir(path.join(root, "practice/writing"), { recursive: true });
  await fs.mkdir(path.join(root, "practice/speaking"), { recursive: true });
}
