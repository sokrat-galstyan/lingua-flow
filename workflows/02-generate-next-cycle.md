# Workflow 02 — Generate the Next Lesson or Batch

Read `AGENTS.md`, `docs/LEARNER_PROFILE.md`, `docs/PROJECT_CONTRACT.md`, `docs/CYCLE_SPEC.md`, `docs/METHODOLOGY.md`, `docs/RESOURCE_POLICY.md`, the master curriculum, resources, all state, and relevant recent lessons before writing.

1. Require customization and a generated master curriculum. If missing, complete workflow 00 and workflow 01 first; no web application is required.
2. Choose the next monotonic cycle number from existing folders and ledger. An unregistered partial batch requires repair; do not silently skip it.
3. If the active batch is unfinished, report missing sessions and require an explicit early-generation override. Document carryover. Never infer completion from elapsed time.
4. Use requested lesson count or the profile default (1–40). Create `plan.md` according to the cycle specification; in web staging use the existing server-created plan unchanged. Take duration and optional reviews from the profile. Generate one lesson when count is one; a full four-week cycle is not required.
5. Explain selected units, priorities, realistic schedule and cross-skill balance in `overview.md`. Link all requested sessions. Keep previous batches immutable.
6. Generate one block of up to five lessons at a time, with a review when enabled. Each lesson must be independently executable, with source fallbacks, feedback and exact configured timing. Check each block before continuing; finish the requested count.
7. Run `python3 tools/validate_project.py --cycle NNN` and `python3 tools/validate_project.py --project`. Inspect educational quality, prerequisites, references and workload separately.
8. After validation, set active/last generated cycle, status `planned`, clear active completion fields to `none reported`, list unfinished IDs, and append a ledger row. Preserve historical evidence and record any override. Never mark generated work completed.
9. Report paths, lesson/review counts, validation, source limitations and the next study action. If incomplete, keep a draft and do not advance the pointer.
