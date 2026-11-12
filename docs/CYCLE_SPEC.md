# Specification: Generate a Custom Lesson Batch

A cycle is a numbered generation batch, not a fixed calendar duration. Generate only the next batch using the master curriculum, current customization, and explicit learning evidence. Retain historical batches.

## Generation plan

Every new `study-plans/cycle-NNN/plan.md` records these exact fields:

- **Lesson count:** 1
- **Review count:** 0
- **Session minutes:** 60

Values above are an example, not fixed requirements. Choose 1–40 lessons from the request or profile default; session minutes must match the saved profile (10–240). With optional reviews enabled, create one review per block of up to five lessons, including the final partial block; otherwise zero. In the web app this plan is created by the server and must not be modified by the agent.

Keep historical paths: `week-01/lesson-01.md` through `lesson-05.md`, `week-02/lesson-06.md` through `lesson-10.md`, etc., up to eight blocks. These folders are navigation blocks; actual calendar pacing follows `sessionsPerWeek`, including reviews. Do not invent calendar dates. Reviews use `week-XX/review.md` and `Cnnn-Rxx`; lessons use `Cnnn-Lxx`. Include only requested files and link every session from `overview.md`.

Legacy batches without `plan.md` retain 20 lessons, four reviews, 120 minutes. New batches must have a plan. Profile changes never redefine existing batches.

## Curriculum and priorities

Use stable unit IDs and their prerequisites. Explain how the learner’s goals, level and stated weak points affect unit selection and time allocation. Self-report is not a placement result. If level is unknown, embed a short optional diagnostic without blocking progression. Revisit observed difficulties through spaced retrieval and new contexts. Short batches may focus on a subset of skills; explain how missing domains return in subsequent batches.

## Independently executable lessons

Follow `templates/lesson.md`. Each lesson includes measurable objectives, prerequisites, unit IDs, target patterns and natural expressions, resource references, meaningful input, precise independent production, feedback, fluency practice, review triggers, and completion evidence. Match task size to available minutes and learner constraints.

Use exactly one activity table between `<!-- ACTIVITY_TABLE_START -->` and `<!-- ACTIVITY_TABLE_END -->`. Five columns: Step, Activity, Exact instructions / expected output, Resource, Minutes. Use integer minutes summing to the plan’s session duration. Optional exposure remains outside focused time. The template is an outline; replace placeholders and allocate time rather than copying example durations.

Reviews retrieve and apply earlier learning, include feedback and reflection, and have the same configured session duration. Maintain grammar, vocabulary, reading, listening, writing, speaking, pronunciation, natural expression and fluency across successive batches; do not require every skill in every short lesson.

## Sources and feedback

Follow `RESOURCE_POLICY.md`: use verified specific references or label `UNVERIFIED` and provide executable fallbacks. Never invent links, page numbers, audio access or assessment results. Use the target language and learner budget. Distinguish actual errors from optional style changes and flag uncertainty in AI feedback. Human teachers are optional, never a prerequisite.

## Acceptance

Validate every block, then the entire batch and project. All requested sessions must exist with correct IDs, links, required sections and durations. Only then update the active pointer and ledger to `planned`, with no completions. Incomplete output stays a draft and must not advance state. A batch is completed only when all sessions listed in its plan have explicit completion evidence.
