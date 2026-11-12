# Specification: Generate the Long-Term Master Curriculum

**Document type:** product requirements and acceptance criteria. **Not a chat prompt.**

## Goal

Create `curriculum/master-curriculum.md`, an enduring, adaptable, comprehensive roadmap that supports self-study of the configured target language at an appropriate starting point. There is **no fixed terminal CEFR target** or arbitrary number of months. Formal language proficiency tests may be optional checkpoints only.

The curriculum is a **topic-and-skill map**, not 20 detailed lessons. Generate it only during initialization or an explicitly approved curriculum revision. Future cycles read from it.

## Learner and environment

Use `docs/LEARNER_PROFILE.md` as the source of customization. Require configured goals, target language, self-reported level (or unknown), priority weaknesses, preferences and schedule before generation. Explain how these choices shape the strategy. Do not assume grammar weakness, existing vocabulary, first language, equipment, interests, or an exam goal. Optional diagnostics should resolve uncertainty without fabricated scores. For languages other than English, adapt the illustrative English inventory below to that language's grammar, writing system, phonology and usage; do not impose English-specific categories.

## Mandatory curriculum coverage

Define and sequence **units** with stable IDs and explicit prerequisites. Group into developmental phases as a convenient narrative (foundation, productive control, increasingly natural discourse, etc.); do **not** use hard B2/C1 graduation gates. Cover at least the following:

### Grammar / syntax

- Parts of speech; clause / sentence patterns; subjects, objects, complements; word order.
- Nouns, countability, singular/plural; articles `a/an/the` and zero article; determiners, quantifiers.
- Personal, reflexive, relative and other pronouns; possessives.
- Verb `be`, `have`, `do`; agreement; forms, regular/irregular verbs; questions, negatives, tags.
- Adjectives/adverbs and placement; comparisons; modifiers.
- Present/past/future meaning; present simple/continuous; past simple/continuous; perfect and perfect continuous aspects; tense/aspect contrasts and narratives; future forms and probability.
- Modal verbs and degrees of certainty, ability, obligation, advice, permission.
- Prepositions of time/place/movement; preposition-verb/adjective combinations.
- Conjunctions, connectors, subordination, relative clauses, noun clauses; complex sentences.
- Passive voice; reported speech; direct/indirect questions.
- Conditionals, wishes, hypotheticals; gerunds/infinitives; participle constructions.
- Discourse grammar, cohesion, referencing, emphasis, inversions, ellipsis, register and common exceptions.

### Vocabulary / lexical competence

- High-frequency core vocabulary used in context; word families, affixes and formation.
- Collocations, multiword expressions, idioms, phrasal verbs, natural alternatives and register.
- Polysemy, confusable words, pragmatic meaning, formal/informal variations, American/British differences.
- Spaced retrieval of useful expressions, not overwhelming isolated word lists.

### Receptive skills

- Reading: graded then authentic texts; gist, details, inference, argument, tone, genre, cohesive markers, speed, extended reading.
- Listening: graded then natural speech; gist, details, connected speech, reductions, accent variety, inference, live interaction, transcript-dependent -> transcript-independent strategies.

### Productive skills

- Writing: correct sentence -> paragraph -> narrative, explanation, summary, personal and professional message -> cohesive argument/essay and complex register, editing and revision.
- Speaking: short guided production -> descriptions and narration -> spontaneous questions/clarification -> extended explanation, discussion and authentic human interaction.
- Pronunciation: segmental sounds, stress, rhythm, intonation, linking/reductions, intelligibility; avoid unsupported claims that accent elimination is necessary.

### Pragmatics / practical communication

- Turn-taking, politeness, directness, formality, small talk, cultural context, implied meanings, misunderstandings, professional and everyday interactions.

### Cross-cutting learning habits

- Grammar knowledge -> accurate independent use -> automaticity; repeated retrieval and spiral review.
- Self-correction and source literacy; effective dictionary use; feedback interpretation.

## Unit design requirements

For every curriculum unit, record in a consistent table or linked section:

- Stable `U-NNN` ID and descriptive title.
- Developmental phase and domain(s).
- Prerequisites by unit ID; avoid circular dependencies.
- Knowledge outcomes and **observable language performance** outcomes.
- Key forms, contrasts, lexical patterns and realistic contexts.
- Required input (reading/listening) and output (speaking/writing), including eventual fluency activity.
- Common errors or transfer difficulties (for the configured primary language where evidence supports; don't invent linguistic claims).
- Suggested trustworthy resources with resource IDs from `curriculum/resources.md`.
- Review/automaticity milestones; conditions for deepening complexity.

A curriculum unit may be covered by several lessons or recur across multiple cycles. A lesson may combine related units where pedagogically sensible. Do not force 1:1 mapping.

## Organization and dependencies

- Provide an accessible phase overview with goals, prerequisites and readiness signs, not fixed calendar promises.
- Include a comprehensive inventory and logical learning order. Distinguish the essential foundations from extensions; clearly link prerequisite chains.
- Show how grammar structures recur in new contexts rather than disappearing after one lesson.
- Maintain breadth in all four strands across the program; any targeted skill emphasis should not eliminate listening or speaking.
- Support fast-tracking of concepts already understood **while still testing authentic use**.
- Avoid repeating elementary content in non-grammar domains when a different domain needs strengthening.
- Address natural expressions (collocations and chunks) early and throughout.

## Resources and feedback architecture

Create/update `curriculum/resources.md` as the curated catalog, referencing `docs/RESOURCE_POLICY.md`. Include publisher, purpose, access, level/suitability caveats, verified official URLs where available, and alternatives. For English learners who benefit from grammar support, consider Grammar in Use with answers as an **optional** paid component; do not invent edition details or textbook unit numbers. For each domain define self-study tasks, tools/AI feedback options, limitations, and later human interaction triggers.

## Long-run progression and measurement

- Define separate evidence dimensions: knowledge, controlled accuracy, spontaneous accuracy, automaticity, comprehension and communicative transfer.
- Propose short low-stakes diagnostic options, targeting uncertain or priority skills from the profile, but do not assume a test outcome.
- Define review scheduling, error logging and advancement rules that accept uneven skill development and do not demand perfection.
- Provide a compact **curriculum index** of unit IDs, titles and prerequisites for use in future agent sessions. Keep a dated change log.
- Include a **portable handoff** section explaining how a cycle generator can use the index with `state/` without reading every historical lesson.

## Deliverable format

Generate `curriculum/master-curriculum.md` with:

1. Design principles and learner constraints.
2. Developmental phase map.
3. Comprehensive sequential units (stable IDs and prerequisites).
4. Cross-skill development, natural expression and automaticity plan.
5. Feedback and human-interaction escalation strategy.
6. Review/progression rules and evidence definitions.
7. Resource IDs / catalog cross-references.
8. Compact index, next unit-selection rules, and change log.

Use `templates/master-curriculum.md` and `templates/curriculum-unit.md` as **format guides**, not as fixed content limits. Do not generate cycle lessons during this step.

## Acceptance tests

- Every domain listed above is explicitly represented.
- Units are non-circular and stable-ID referenced.
- Resource claims distinguish verified, unverified and optional paid materials.
- No invented CEFR placement or completion dates.
- Can begin cycle 001 without a separate teacher or compulsory paid subscription.
- Can derive future lessons through the curriculum index plus persistent state alone.
