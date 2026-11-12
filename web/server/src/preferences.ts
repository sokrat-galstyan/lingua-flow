import { Files, AppError } from "./files.js";
import { parsePreferences } from "../../shared/preferences.js";
export async function readPreferences(files: Files) {
  const doc = await files.read("docs/LEARNER_PROFILE.md");
  try {
    return { preferences: parsePreferences(doc.content), hash: doc.hash };
  } catch {
    throw new AppError(
      409,
      "Learner customization is malformed; repair the JSON in docs/LEARNER_PROFILE.md.",
    );
  }
}
export function planText(count: number, minutes: number, reviews: boolean) {
  return `# Generation plan\n\n- **Lesson count:** ${count}\n- **Review count:** ${reviews ? Math.ceil(count / 5) : 0}\n- **Session minutes:** ${minutes}\n\nFolders group up to five lessons for navigation; calendar pacing follows the learner profile. This snapshot is immutable after generation.\n`;
}
export async function batchCounts(files: Files, cycle: string) {
  let content: string;
  try {
    content = (await files.read(`study-plans/${cycle}/plan.md`)).content;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      return { lessons: 20, reviews: 4 };
    throw e;
  }
  const value = (key: string) =>
    Number(
      content.match(new RegExp(`^- \\*\\*${key}:\\*\\* (\\d+)$`, "m"))?.[1],
    );
  const lessons = value("Lesson count"),
    reviews = value("Review count");
  if (
    !Number.isInteger(lessons) ||
    lessons < 1 ||
    lessons > 40 ||
    ![0, Math.ceil(lessons / 5)].includes(reviews)
  )
    throw new AppError(
      409,
      "Batch plan is malformed; repair it before recording progress.",
    );
  return { lessons, reviews };
}
