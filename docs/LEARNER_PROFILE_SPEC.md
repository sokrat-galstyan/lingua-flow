# Learner profile format

The framework uses `docs/LEARNER_PROFILE.md` as its durable customization file. Configure it with a CLI coding agent via [workflow 00](../workflows/00-configure-learning.md), or edit it yourself in a text editor. The web form is an optional editor for the same format, not a prerequisite.

Use a Markdown heading, a short explanation that preferences are self-reported, and exactly one fenced `json` block. All keys below must be present. JSON must have quoted strings, integer numbers, `true`/`false` booleans, and no comments or trailing commas.

| Key | Accepted values / meaning |
|---|---|
| `targetLanguage` | Nonempty string; language being learned |
| `primaryLanguage` | String; use `""` if not supplied |
| `level` | `"unknown"`, `"A1"`, `"A2"`, `"B1"`, `"B2"`, `"C1"`, or `"C2"`; self-report only |
| `goals` | Nonempty string; learner's purpose and desired outcomes |
| `weaknesses` | String; stated weak points, or `""` if unknown |
| `interests` | String; preferred topics/contexts, or `""` |
| `constraints` | String; formats, language variety, accessibility, equipment or other preferences, or `""` |
| `budget` | `"free"` or `"paid-optional"` (with free alternatives) |
| `lessonMinutes` | Integer 10–240; focused minutes per lesson and review |
| `sessionsPerWeek` | Integer 1–7; lessons and reviews both count |
| `defaultLessonCount` | Integer 1–40; default number of lessons per generation request |
| `includeReviews` | Boolean; if true, add one review per block of up to five lessons, including a final partial block |

Text fields have a maximum of 2,000 characters. Do not convert an unknown level or empty weaknesses into an invented assessment. A one-lesson batch with reviews enabled has one lesson plus one review.

[templates/learner-profile.md](../templates/learner-profile.md) provides a syntactically valid example. Replace its sample preferences with your own before copying it to the live profile. The initial live profile intentionally has no JSON block and is unconfigured.

The [CLI guide](CLI_GUIDE.md#configure-your-learning) contains a prompt that writes this file for you. The web implementation mirrors the format in `web/shared/preferences.ts`; using the format through CLI does not require Node.js or importing that module.

Profile changes apply to future generation. Existing batch plans remain immutable. If new goals require changing an existing master strategy, request a named revision and a documented handoff rather than silently regenerating it. `python3 tools/validate_project.py --project` checks required files; it does not validate this JSON schema or assess the learner. Ask the agent to check the fields and ranges separately.
