import { z } from "zod";
const shortText = z.string().trim().max(2000);
export const preferencesSchema = z.object({
  targetLanguage: shortText.min(1),
  primaryLanguage: shortText,
  level: z.enum(["unknown", "A1", "A2", "B1", "B2", "C1", "C2"]),
  goals: shortText.min(1),
  weaknesses: shortText,
  interests: shortText,
  constraints: shortText,
  budget: z.enum(["free", "paid-optional"]),
  lessonMinutes: z.number().int().min(10).max(240),
  sessionsPerWeek: z.number().int().min(1).max(7),
  defaultLessonCount: z.number().int().min(1).max(40),
  includeReviews: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences: Preferences = {
  targetLanguage: "English",
  primaryLanguage: "",
  level: "unknown",
  goals: "",
  weaknesses: "",
  interests: "",
  constraints: "",
  budget: "free",
  lessonMinutes: 60,
  sessionsPerWeek: 3,
  defaultLessonCount: 1,
  includeReviews: false,
};
export function parsePreferences(content: string): Preferences | null {
  const match = content.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  return preferencesSchema.parse(JSON.parse(match[1]));
}
export function formatPreferences(value: Preferences) {
  return (
    "# Learner customization\n\nThese are learner preferences and self-reported priorities, not assessment results. Unknown level requires optional diagnostic tasks. Changes apply to future generation; existing lessons remain historical records.\n\n```json\n" +
    JSON.stringify(value, null, 2) +
    "\n```\n"
  );
}
