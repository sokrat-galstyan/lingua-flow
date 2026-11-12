# Workflow 01 — Initialize the Master Curriculum (one time)

**Trigger:** "Initialize curriculum", "Set up the master syllabus", or explicit first-run setup.

**Read first:** `AGENTS.md`, `docs/LEARNER_PROFILE.md`, `docs/PROJECT_CONTRACT.md`, `docs/CURRICULUM_SPEC.md`, `docs/METHODOLOGY.md`, `docs/RESOURCE_POLICY.md`, `curriculum/resources.md`.

1. Require a configured learner profile. If absent, follow workflow 00 through CLI or manual profile editing instead of assuming personal preferences; do not require the web form. Inspect the repository. If `curriculum/master-curriculum.md` already exists and appears complete, **do not overwrite** it; offer validation or an explicit targeted revision.
2. Confirm current state is `uninitialized` (or handle other states conservatively).
3. Build a long-run ordered unit list with prerequisites and cross-skill outcomes following **all** coverage requirements in `docs/CURRICULUM_SPEC.md`. Use `templates/master-curriculum.md` and `templates/curriculum-unit.md` for format.
4. Use reliable existing sources for learning references; research links if web access is available. Mark unverifiable specific references as `UNVERIFIED`; don't invent titles or book units. Update the catalog while retaining stable `RES-NNN` IDs.
5. Include a concise portable curriculum index so future cycles don't require loading all prose; define how to select the next units given persistent progress and weaknesses.
6. Check that starting units and priorities match the learner profile, with no invented placement assessment. Include input, output, pronunciation and natural expressions at an appropriate level.
7. Run `python3 tools/validate_project.py --project`, plus manual checks described in the curriculum specification. Only when successful, update `state/current-cycle.md` to `ready` and keep `Active cycle: none`.
8. Report created files, number of units, coverage gaps, source-verification limitations, and the next action: generate cycle 001.

**Boundary:** This workflow does **not** create lessons or imply a placement-test result. It is safe to run once, and idempotent on later use.
