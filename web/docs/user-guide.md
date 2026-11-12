# Lingua Flow — web user guide

The primary learning workflow is the [CLI guide](../../docs/CLI_GUIDE.md). This browser interface is a convenience layer over the same files, not a required part of the framework.

## Known issues

The web Codex integration is user-reported to show intermediate JSON instead of readable response streaming and to fail tasks because of permissions. Other providers were unavailable and not checked. No investigation or fix is claimed. Use CLI for configuration, strategy/lesson generation and AI review; see [the issue record](../../docs/KNOWN_ISSUES.md).

## Opening an existing learning project

Configure the learner profile and generate your strategy/lessons through CLI first. Start the UI using [web setup](../README.md). The dashboard reads those same files. If no profile exists, the current UI opens **Customize learning**; you may fill that optional form or create the profile through CLI and refresh. Saving the form does not establish a working web-agent workflow, even if it navigates to the AI Agents page.

Preferences affect future generation; existing strategy revisions use explicit terminal workflows and preserve history. Refresh after CLI changes, and avoid simultaneous edits with unsaved browser drafts.

## Study-room features

## Learn

The dashboard reads the active-cycle pointer and recorded evidence. **Continue Learning** opens the first unfinished session, including weekly reviews in sequence. Opening a lesson does not record a start or completion. Each batch uses its saved lesson count, optional review count and session duration; no achievement is inferred from those files existing.

Study Plan lists discovered cycles and their weeks. Each lesson provides a reading view, previous/next navigation, related curriculum units, personal notes, and progress actions. The full curriculum includes phases, unit prerequisites, outcomes, resource links, and connected lessons, parsed from the actual document. Resources and project documentation are read-only.

Use Search for full-text matches across lessons, units, notes, writing, and documentation. External links open separately. Internal Markdown links resolve relative to the document. The right-hand contents and related-unit panels collapse. On phones, use the menu button. Switch light/dark mode in the navigation footer.

## Write

My Notes, Writing Practice, and Vocabulary are views into `practice/notes/`, `practice/writing/`, and `practice/vocabulary/`. Create other Markdown documents anywhere under `practice/`, such as `practice/reflections/` or `practice/speaking/`. Include a stable lesson, unit, or cycle identifier in the filename when helpful. **Add note** and **Writing exercise** on a lesson prefill its ID.

Use split, edit, or preview mode. Formatting buttons insert Markdown; Ctrl/Command+S saves. Cancel changes restores the loaded version. Save checks a content hash; an external edit causes a conflict instead of overwriting. If a conflict occurs, copy your unsaved text somewhere safe, reload, and manually merge. Browser reloads lose unsaved drafts, with an unload warning when supported.

Rename moves a document within `practice/`. Delete moves it to `.english-web/trash/`; each retained file names its original path. Restore by copying it back in the filesystem. Generated lessons cannot be edited, renamed, or deleted by these endpoints.

## Record progress

Open **Record session progress / difficulty** in a lesson, or use Progress to choose any active-cycle lesson/review. Select In progress or Completed only for work you actually performed. Not started records an explicit correction. Optional fields capture difficulties, grammar, expressions, speaking, writing, extra time, and review needs.

The app appends self-reported evidence to the learning journal, updates the active pointer, and appends a ledger snapshot. A cycle becomes completed only when all sessions required by the batch plan have explicit completion records. Topic mastery is never assigned. Historical cycle corrections remain a terminal workflow operation.

Grammar Mistakes accepts an original sentence without requiring a correction. Corrections and explanations are optional and remain unverified self-report. Add another dated example to record a subsequent review; historical examples are retained rather than overwritten.

Project views refresh every five seconds. Use Refresh for immediate changes. External free-form learning notes remain readable, but completion counts require stable IDs in the canonical completion fields or the documented `Session status` entries. Ambiguous prose is not guessed.

## AI feedback and generation

For current use, run a coding agent directly from the project root. Give it exact paths to the notes or writing saved here, using the [feedback prompts](../../docs/CLI_GUIDE.md#ask-for-feedback-without-recording-completion). Save feedback as a new file under `practice/reviews/`, preserve originals, and record completion separately.

The experimental AI Agents screen has provider selection, workflow previews and staged-file review. These controls describe intended behavior, not verified live operation. The reported Codex failures above remain unresolved. A failed task must not be treated as a successful generation or import. If there is an existing pending import/recovery journal, use the [recovery guidance](architecture.md) before further writes. See [provider-specific status](agents.md).
