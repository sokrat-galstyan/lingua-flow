# Persistent Project Contract

## Canonical ownership and precedence

1. `docs/LEARNER_PROFILE.md`: durable learner preferences; update only when user changes them.
2. `docs/CURRICULUM_SPEC.md`: rules for master-curriculum design.
3. `curriculum/master-curriculum.md`: generated roadmap, scope and stable unit IDs.
4. `docs/CYCLE_SPEC.md`: rules for configurable lesson batches.
5. `state/current-cycle.md`, `state/cycle-ledger.md`, `state/learning-record.md`, `state/recurring-mistakes.md`: authoritative evidence and next-cycle decisions.
6. `study-plans/cycle-NNN/`: generated historical lesson plans.
7. `practice/`: learner-created artifacts; never infer their contents if absent.

Conflicts: direct explicit user instructions override defaults; otherwise preserve stable specifications, do not silently rewrite curriculum requirements when generating cycles. Log significant curriculum adjustments in `curriculum/master-curriculum.md` change log.

## Identifiers and file paths

- Curriculum units: `U-001`, `U-002`, ... sequential, stable even if later regrouped. More advanced units may link to multiple earlier units. A unit is NOT equal to a lesson.
- Cycles: `cycle-001`, `cycle-002`, ... zero-padded to at least three digits, monotonically increasing.
- Lessons: `C001-L01` through the requested count (maximum `C001-L40`) for the first cycle; new cycles use corresponding `C002-L01` etc. Numbering restarts per cycle.
- Reviews: `C001-R01` through the configured review count (zero to eight).
- Paths: `study-plans/cycle-001/overview.md`; `week-01/lesson-01.md` to `lesson-05.md`; `week-02/lesson-06.md` to `lesson-10.md`; and so on. Each block has `review.md` only when reviews are enabled.
- State must name the active cycle, or `none`, and its status.

## Allowed lifecycle and conditions

- `uninitialized`: no generated curriculum. Use `workflows/01-initialize.md`; move to `ready` when finished.
- `ready`: curriculum exists and no active cycle. New plan generation allowed.
- `planned`: full next cycle generated and validated; **not** evidence of learning.
- `in-progress`: learner explicitly reports beginning/completing some activities.
- `paused`: learner explicitly pauses; retain active cycle.
- `completed`: learner confirms explicit completion of every session required by the batch plan. Distinguish completion from mastery.

A fresh cycle ordinarily requires the previous active cycle's explicit `completed` status. If the learner requests early generation, first flag outstanding work and obtain explicit override; document carried-over lessons. Do not skip unfinished work silently.

## Idempotency and safe changes

- If `cycle-NNN/` already exists, do **not** overwrite it when asked to generate it again. Report the existing cycle and offer validation/repair. For requested revisions, create a versioned revision or a clearly labeled correction with a change note.
- When generating a cycle, create it provisionally, validate, and **only then** update `state/current-cycle.md` and append to `state/cycle-ledger.md`. An incomplete partial cycle is `draft`, not a completed deliverable.
- Never overwrite a learner's practice files, recorded reflections or historical records.
- Retain all old cycles; avoid putting the entire archive into every new model context. Read compact state, curriculum index and the last 1–2 cycles as necessary.
- Before doing destructive or large structural migrations, ask for explicit approval or produce a non-destructive proposal.

## Evidence conventions

Tag observations as `self-reported`, `exercise evidence`, `AI feedback (unverified)`, or `human feedback` where relevant.

- Generated lesson -> no completion status.
- Completion -> learner states task done; not equivalent to correctness.
- Performance -> may be inferred only from submitted answers, corrected writing, exercise results, or explicitly reported observations.
- Mastery -> do not declare on one accurate exercise; use repeated accurate transfer to new contexts and spontaneous production.
- Unknown -> write `unknown`, not an invented score.

## Source integrity

- Track `verified (date, method)`, `unverified`, or `unavailable` for specific resource references. A verified **landing page** is not evidence that a named sublesson exists.
- Link citation is not a license to reproduce copyrighted textbook chapters.
- If no source can be verified, create an executable fallback task using learner-supplied or public-domain materials and label any uncertain reference.

## Required files and exit criteria

- `curriculum/master-curriculum.md` and `curriculum/resources.md` exist before cycle generation.
- Exactly the lesson and review counts in the immutable batch `plan.md`, plus overview. Legacy batches without plans retain their original 20/4/120 contract.
- `<!-- ACTIVITY_TABLE_START -->` / `<!-- ACTIVITY_TABLE_END -->` delimit the exact timed activity table in each lesson and review.
- Timing in each session sums to the session minutes in `plan.md`; optional exposure is outside focused time.
- Each lesson has objectives, prerequisites, verified or flagged resources, integrated input/output, feedback, fluency, review and completion criteria.
- Update ledger and active-cycle pointer only after validation; never mark any tasks completed merely because files were generated.

## Customization

`docs/LEARNER_PROFILE.md` stores preferences as a JSON block following `docs/LEARNER_PROFILE_SPEC.md`. CLI agents use workflow 00; learners may edit the profile manually and check its fields and ranges. The optional web configuration endpoint validates the same format and uses conflict checks; ordinary web document CRUD remains practice-only. Profile changes guide future generation and never rewrite history. A master strategy revision must be explicitly requested and named. Before first initialization require customization; do not infer preferences from a previous learner.

## CLI and optional UI

The framework runs through file-based agent workflows without the web app. CLI agents may make authorized profile, curriculum and state changes under the relevant workflow; learners create practice artifacts in a text editor. Review direct CLI changes in the files or version-control diff. Web staging/import and endpoint restrictions describe the optional web integration, not a mandatory layer for CLI work. Preserve ownership and evidence rules in either interface.
