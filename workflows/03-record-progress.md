# Workflow 03 — Record Learner Progress (repeatable)

**Trigger:** Learner reports a completed lesson, exercise result, speaking observation, difficulty, or correction.

1. Read `docs/PROJECT_CONTRACT.md`, the current cycle/lesson files and `state/`.
2. Parse only what the learner actually reported or supplied as artifacts. If a statement is ambiguous, preserve the uncertainty; do not infer that all exercises were completed.
3. Append a dated entry to `state/learning-record.md` using `templates/learning-entry.md`, recording cycle + lesson ID(s), what was done, self-reported difficulty, external feedback if present, and next review need.
4. Update `state/recurring-mistakes.md` only if an identifiable language pattern is evidenced. Distinguish user-reported struggles (e.g., articles) from observed repeated incorrect sentences.
5. Update `state/current-cycle.md`: mark `in-progress` when learner first reports actual work; enumerate confirmed lesson/review completions, unfinished tasks and review priorities. Do not mark a topic `mastered` without multiple demonstrated transfers.
6. Keep `state/cycle-ledger.md` synchronized for cycle status changes, while retaining prior record entries. Do not mark cycle `completed` until all sessions required by the batch plan are explicitly confirmed.
7. Report exactly what was recorded, what remains, and any uncertainty. Never silently modify the curriculum or regenerate new lessons.

**Example:** Learner says "I finished L01–L04, articles still feel difficult." Record completion for those four lessons only; write 'article use: self-reported difficulty'; schedule follow-up, not fabricated incorrect answers.
