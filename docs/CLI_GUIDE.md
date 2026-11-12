# Learn with a CLI coding agent

This is the primary way to use Lingua Flow. The coding agent maintains Markdown files; you study independently and save evidence for later feedback. You do not need to install or run `web/`.

The examples use Codex CLI. Another file-capable coding agent can follow the same repository workflows if you explicitly ask it to read `AGENTS.md`; its commands and permissions may differ.

## Prepare your workspace

1. Clone or extract the `lingua-flow` repository into a private study folder. Use a separate folder for each learner; keep a clean checkout for public contributions.
2. Install Python 3.10+ and a text editor/Markdown viewer. The project validator has no third-party Python dependencies.
3. Install Codex and authenticate using the [official Codex CLI instructions](https://learn.chatgpt.com/docs/codex/cli). If you use the npm installation method, the command is `npm install -g @openai/codex`; that method needs npm, but the learning framework itself does not need the web application's dependencies.
4. In a terminal, change to your study folder (the directory containing `AGENTS.md` and `README.md`), then run:

```bash
python3 tools/validate_project.py --project
codex
```

The first Codex run prompts for sign-in if needed. Paste the task prompts below into its interactive session, not into your shell. Codex reads repository instructions through [`AGENTS.md`](https://learn.chatgpt.com/docs/agent-configuration/agents-md); this repository already includes that file, so do not regenerate it with `/init`.

Use permissions that allow the requested project edits and validator commands, and review tool approvals in the CLI. These instructions do not require unrestricted execution. Agent writes occur directly in the project under the CLI's controls; the web application's staging/import step does **not** apply. Inspect changed files (or `git diff` and `git status --short` in a Git checkout) after each task, including newly created files. Keep backups or private Git checkpoints.

## Configure your learning

Replace the bracketed entries below before sending. You can answer `unknown` for level and leave optional preferences empty. This task creates configuration only; it must not invent learner history.

```text
Read AGENTS.md and follow workflows/00-configure-learning.md.
Configure docs/LEARNER_PROFILE.md using docs/LEARNER_PROFILE_SPEC.md:
- Target language: [language]
- Primary language: [language, or leave blank]
- Current self-reported level: [unknown or A1/A2/B1/B2/C1/C2]
- Goals: [what I want to do with the language]
- Weak points: [what feels difficult, or unknown]
- Interests: [topics, or leave blank]
- Constraints/preferences: [formats, variety, accessibility, equipment, or blank]
- Budget: [free or paid-optional]
- Focused minutes per lesson/review: [10–240]
- Study sessions per week, including reviews: [1–7]
- Default lessons per request: [1–40]
- Add review sessions: [true or false]
Ask about missing essential choices. Check the profile fields and ranges.
Do not generate a curriculum or lessons yet. Do not record progress.
```

Read the resulting [learner profile](LEARNER_PROFILE.md). You may also edit it manually using the [format specification](LEARNER_PROFILE_SPEC.md) and [example template](../templates/learner-profile.md). Keep exactly one valid JSON block. The web form is optional.

## Generate the master strategy

Once the profile reflects your preferences, send:

```text
Read AGENTS.md and follow workflows/01-initialize.md.
Generate curriculum/master-curriculum.md and update curriculum/resources.md
from my saved learner profile and docs/CURRICULUM_SPEC.md. Explain how my
level, goals and weak points influence sequencing and skill balance.
Use stable unit IDs and prerequisites. Mark unchecked resources UNVERIFIED
and provide usable alternatives. Do not invent placement results.
Do not generate lessons yet or overwrite an existing master curriculum.
Validate the project; set ready/no active cycle only after successful checks.
Report the files to read, validation results and remaining source limitations.
```

Open `curriculum/master-curriculum.md` and `curriculum/resources.md` in your editor. Check the goals, priorities, starting difficulty and resource access before requesting lessons. The master is a roadmap, not a set of daily assignments. Initialization should leave `state/current-cycle.md` at `ready` with no active cycle.

## Generate one lesson or a batch

For a single next lesson:

```text
Read AGENTS.md and follow workflows/02-generate-next-cycle.md.
Generate exactly 1 lesson in the next numbered cycle, using my profile's
session duration and review setting. Read the master curriculum, all state,
and relevant recent practice feedback before choosing units.
Create the batch plan.md, overview.md and complete executable session files.
If the active cycle is unfinished, report the remaining work and stop before
generating unless I explicitly authorize carrying it over.
Validate the batch and project. Update state to planned only after validation.
Do not mark any generated work started, completed or mastered.
```

For a batch, replace `exactly 1 lesson` with `exactly 5 lessons` (or any count from 1–40). This overrides the default count for that request; it does not change your saved preferences. Reviews are additional sessions: five lessons with reviews enabled means six sessions. A one-lesson request with reviews enabled means two sessions.

For the first batch, read `study-plans/cycle-001/overview.md`, then `study-plans/cycle-001/week-01/lesson-01.md`. The batch also has `plan.md` with its saved counts and timing. Folder names such as `week-01` are navigation blocks, not a mandatory five-day schedule.

Each request creates a new numbered batch: one lesson in `cycle-001` is `C001-L01`; a later one-lesson batch starts at `C002-L01`. Use the full ID when naming work or recording progress. Existing batches are not silently extended or replaced.

## Save your work manually

Use a text editor to create Markdown files under `practice/`. Create a subfolder if it does not exist. No upload or web form is required. Keep the assigned lesson files unchanged and put answers, notes and revisions in separate learner files.

| What you save | Example path |
|---|---|
| Lesson notes, questions, comprehension answers | `practice/notes/C001-L01-notes.md` |
| Controlled exercise answers | `practice/notes/C001-L01-exercises.md` |
| Original writing | `practice/writing/C001-L01-original.md` |
| Your revised writing | `practice/writing/C001-L01-revision-01.md` |
| Speaking transcript and self-observations | `practice/speaking/C001-L01-notes.md` |
| Vocabulary and personal example sentences | `practice/vocabulary/C001-L01-expressions.md` |
| Saved AI feedback | `practice/reviews/C001-L01-feedback-01.md` |
| Batch reflection | `practice/reflections/C001-reflection.md` |

These are naming examples, not pre-existing files or claimed completions. Add a date or increment a suffix for later attempts instead of overwriting originals. Audio recordings can remain local under `practice/speaking/`, but do not assume your coding agent can listen to them. Supply a transcript and label it as a transcript; text alone cannot establish pronunciation quality.

A useful note structure to copy and fill:

```markdown
# C001-L01 — My notes

- Date:
- Lesson: study-plans/cycle-001/week-01/lesson-01.md
- Activities actually attempted:
- Help used: dictionary / answer key / AI / none
- Time spent:

## My original answers or writing

## Questions and difficulties

## Speaking/listening observations (self-report)

## Still unfinished

## Sources I could not access
```

Keep AI corrections separate from your original output. Identify whether an answer was independent, copied, corrected, or produced with help. Saving a file does **not** automatically update progress or queue an AI review: give the agent its exact path in a later request.

## Ask for feedback without recording completion

Replace the paths with files you actually saved:

```text
Read AGENTS.md, docs/PROJECT_CONTRACT.md and the assigned lesson
study-plans/cycle-001/week-01/lesson-01.md. Review only these learner artifacts:
practice/notes/C001-L01-exercises.md
practice/writing/C001-L01-original.md
practice/speaking/C001-L01-notes.md
If a file is absent, report that; do not infer its contents.
Give corrections with brief explanations, distinguish errors from optional
style changes, and suggest a short retry task. Preserve all originals.
Save feedback in a new practice/reviews/C001-L01-feedback-01.md; if it exists,
use the next unused suffix. Label AI feedback as unverified.
Do not update state or mark the lesson completed. Do not assess pronunciation
from a written transcript or claim to have heard unavailable audio.
```

Read the feedback, ask about unclear corrections and save your next attempt as a separate revision. Tell the agent which revision to compare with the original. Feedback is evidence to consider, not a guaranteed correct assessment.

## Record actual progress

After studying, tell the agent exactly what you completed. Replace every bracketed entry with true information; explicitly say when a lesson is only partially done.

```text
Follow workflows/03-record-progress.md and read the relevant lesson and state.
Session: [full ID, such as C001-L01]
Actually completed activities: [list]
Still unfinished: [list, or none]
I confirm the whole session is complete: [yes or no]
Evidence files: [exact paths to originals, revisions and feedback]
My difficulties and observations: [what I noticed]
Record only this evidence. Distinguish self-report, submitted work and
unverified AI feedback. Synchronize state/current-cycle.md,
state/learning-record.md, state/recurring-mistakes.md and state/cycle-ledger.md
as appropriate. Do not infer mastery or complete other sessions.
Run project validation and report what remains unfinished.
```

Prefer this workflow to editing completion counters manually: it reconciles the journal, active pointer and ledger. You can freely add practice notes; `state/` is the managed record. Mention reviews separately using IDs such as `C001-R01`.

## Review a batch and continue

```text
Follow workflows/04-review-cycle.md. Read the active batch, all state, and
these saved artifacts and feedback: [paths]. Identify supported strengths,
recurring problems, missing evidence and priorities for the next batch.
Write the next-cycle handoff. Do not invent results or infer completion from
file existence. Do not generate lessons yet. Report whether generation is ready.
```

Then use the generation prompt again. If you deliberately want another batch before finishing the current one, first review the outstanding sessions and explicitly authorize carrying those exact IDs forward. Do not mark them completed to unlock generation.

To change duration, focus or schedule, follow workflow 00 again and specify only the changed settings. To change the master strategy, explicitly request a named revision with a change log and handoff, preserving previous lesson plans and evidence.

## Resume in a fresh conversation

Start `codex` from the same project folder and send:

```text
Read AGENTS.md, docs/LEARNER_PROFILE.md, the master curriculum if present,
and all state files. Summarize the current batch, unfinished sessions and
recorded priorities. Do not rebuild the project or invent progress.
My next task is: [generate / review these paths / record this evidence / explain].
```

The files carry context between conversations. You do not need the original chat. New evidence files are not automatically promoted into state; point them out when asking for review.

## Validation, incomplete work and resource repair

From the root, outside the interactive agent session:

```bash
python3 tools/validate_project.py --project
# Only after cycle-001 exists; substitute the actual cycle number:
python3 tools/validate_project.py --cycle 001
```

The validator checks structure and timing, not language accuracy, learner ability, profile JSON or source availability. Inspect educational quality separately.

If generation stops halfway, ask the agent to inspect and finish the **same draft batch**, preserving existing work, then validate it before advancing state. Do not start another numbered cycle to hide an incomplete draft. If a resource is inaccessible, ask it to follow `workflows/05-repair-resources.md` for the exact lesson and source; unchecked references need `UNVERIFIED` labels and a usable fallback.

If you also use the optional UI, avoid simultaneous terminal writes and unsaved browser edits. Refresh afterward. Existing pending web imports or recovery journals need the documented [recovery process](../web/docs/architecture.md); direct CLI editing is not a substitute for reconciling interrupted writes. See [known web-agent issues](KNOWN_ISSUES.md).
