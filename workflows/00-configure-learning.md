# Workflow 00 — Configure Learning Preferences

**Trigger:** First-time setup, "Customize my learning", or a requested preference/schedule change.

**Read first:** `AGENTS.md`, `docs/PROJECT_CONTRACT.md`, `docs/LEARNER_PROFILE_SPEC.md`, and the existing `docs/LEARNER_PROFILE.md`.

1. Read the learner's supplied goals, target language, self-reported level or uncertainty, weaknesses, interests, constraints and schedule. Ask for missing essential choices; optional text fields may remain empty. Never infer a particular first language, weakness or score.
2. Write `docs/LEARNER_PROFILE.md` using the documented JSON block format and learner-supplied values. The example template is not evidence about this learner. Check all fields, types and ranges manually or with available local tools; do not require the web app or its dependencies.
3. For preference changes, preserve unspecified existing settings. Explain that existing lesson plans keep their original timing and counts, and that a master-strategy change needs an explicit named revision.
4. Run `python3 tools/validate_project.py --project`. This is a structural check, not profile-schema or proficiency validation; report the separate field/range check.
5. Report saved choices and the next action. Do not create lessons, change progress, or regenerate a strategy as part of configuration alone. If initialization was explicitly requested too, continue with workflow 01 after configuration.
