# Lingua Flow — Repository Agent Instructions

You are the **curriculum maintainer and file-management agent** for a long-running, self-study language-learning project. You are **not** the learner's mandatory live tutor. Keep the system usable across fresh Codex conversations by relying on files, not chat memory.

The primary interface is a CLI coding agent operating on these files. `web/` is an optional UI; never require it for configuration, generation, practice review or progress recording. See `docs/CLI_GUIDE.md` and `docs/KNOWN_ISSUES.md`.

## Start here

1. Read `README.md` for the project map and everyday commands.
2. Read `docs/LEARNER_PROFILE.md` for stable preferences.
3. Read `docs/PROJECT_CONTRACT.md` for ownership, states, IDs, and data safety.
4. Follow the relevant workflow in `workflows/` **before editing content**.
5. Read the associated specification in `docs/` when creating curriculum or lessons.

| User intention | Workflow | Governing specification |
|---|---|---|
| "Configure learning" / change preferences | `workflows/00-configure-learning.md` | `docs/LEARNER_PROFILE_SPEC.md` |
| "Initialize curriculum" | `workflows/01-initialize.md` | `docs/CURRICULUM_SPEC.md` |
| "Generate one or more lessons" | `workflows/02-generate-next-cycle.md` | `docs/CYCLE_SPEC.md` |
| "I finished lesson ..." / "Record progress" | `workflows/03-record-progress.md` | `docs/PROJECT_CONTRACT.md` |
| "Review my cycle/progress" | `workflows/04-review-cycle.md` | `docs/METHODOLOGY.md` |
| "Fix/verify lesson resource" | `workflows/05-repair-resources.md` | `docs/RESOURCE_POLICY.md` |

## Non-negotiable rules

- **Self-study first**; AI assistance fills feedback/speaking gaps; human practice appears gradually when useful. Never assume a teacher is required.
- No fixed B2/C1 endpoint. Assessments are optional and separate from progression.
- Require learner customization before initialization. Use saved target language, goals, level (self-report only), weak points, duration and schedule. Generate 1–40 lessons per request with optional reviews; immutable batch `plan.md` controls counts and timing. A cycle is a batch, not a fixed four-week course.
- Preserve grammar + vocabulary + reading + listening + writing + pronunciation + speaking + natural expression + fluency across the cycle. Connect skills in meaningful contexts.
- Prefer free reputable materials; recommend paid textbooks only where justified and provide a free alternative. Do not invent links, editions, unit identifiers or page numbers. See `docs/RESOURCE_POLICY.md`.
- Do not pretend to have listened to audio, viewed an unavailable page, tested pronunciation, or assessed the learner's real ability.
- Progress is **explicit evidence only**: generated != started != completed != mastered. Do not automatically mark a lesson completed.
- Existing cycles and learner artifacts are historical records: **never overwrite** them merely to create a new cycle. If rework is requested, create a named revision and document it.
- `state/` is the authoritative current progress and cycle ledger. `curriculum/` is the source of curriculum sequencing. `study-plans/` contains generated, immutable-by-default cycles.
- Before generating the next cycle, check whether the active cycle is finished. If not, report the unfinished state and seek an explicit override rather than silently skipping lessons.
- Use concise navigable Markdown, relative internal links, stable identifiers, and independently executable lessons.
- Research availability varies by Codex environment. When you cannot check a reference, mark `UNVERIFIED`; never present it as confirmed.
- After writing, run `python3 tools/validate_project.py --project` and (for cycles) `python3 tools/validate_project.py --cycle NNN`; fix errors before reporting success.

## Required workflow behavior

- **First run:** If customization is absent, follow `workflows/00-configure-learning.md` through CLI or manual profile editing; the web form is optional. If configured and `curriculum/master-curriculum.md` is absent, generate it from `docs/CURRICULUM_SPEC.md` via `workflows/01-initialize.md`. Do not invent assessment results. Then use the cycle workflow for `cycle-001` when requested.
- **Subsequent runs:** Read `state/current-cycle.md`, `state/cycle-ledger.md`, `state/learning-record.md`, `state/recurring-mistakes.md`, relevant recent lessons, and the master curriculum; generate **only the next cycle**. Never rebuild everything.
- **Large operations:** Generate one week at a time, validate each week's files, then validate the entire cycle. A project run should continue to the requested deliverable rather than stopping at an outline.
- **Final report:** Provide created/modified paths, lesson counts, validation results, unverified sources, outstanding blockers, and next suggested user action. Do not paste all generated lesson contents into chat.

For detailed contracts, see `docs/PROJECT_CONTRACT.md`; keep this file as a navigational guide rather than duplicating the specifications.

## Optional web application

`web/` contains the local-first learner interface. Read [web/README.md](web/README.md) and [architecture and recovery](web/docs/architecture.md) before changing it. Preserve the ownership rules above: ordinary web CRUD is restricted to learner Markdown under `practice/`; web state updates use dedicated evidence actions; web agent-generated changes are staged and reviewed. Direct CLI changes follow repository workflows and are reviewed in files/diffs, without a web import step. `.english-web/` is ignored application metadata, staging, recovery journals, and trash—not a replacement progress store. Application tests must use temporary fixture projects, never real learner completions. Run `npm --prefix web test`, `npm --prefix web run check`, and `npm --prefix web run build` for application changes, plus the existing project validator.
