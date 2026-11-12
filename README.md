# Lingua Flow

Lingua Flow is a **CLI-first, file-based framework** for personalized self-study. Use a coding agent such as Codex CLI to turn your goals, current level, weak points and available time into a master curriculum and actionable lessons. Study independently, save your work in Markdown, and ask the agent to review it later.

The framework is the repository's specifications, workflows, templates and persistent learning files. **The web interface is an optional later addition**, not a required runtime or the foundation of the project. You can configure, generate, study, record progress and review entirely through CLI and a text editor.

**Status:** early prototype. English is the default; other target languages are configurable but their generated teaching content has not been evaluated. Each project folder represents one learner. Generated never means completed or mastered.

## Known issues — read before using the web interface

The **web-interface Codex integration is reported not to work**: it displays intermediate JSON messages instead of readable AI streaming, and tasks fail because of permissions. This was checked by the user for Codex only; Claude Code was unavailable, so its behavior is unknown. The report has not been investigated or fixed.

**Use Codex CLI directly from the project root for agent tasks.** See the [step-by-step CLI guide](docs/CLI_GUIDE.md) and [known-issues record](docs/KNOWN_ISSUES.md). Passing mock/browser tests does not establish working live web-agent execution.

## What the framework supports

- Target language, self-reported level (including “unknown”), goals, weak points, interests and learning constraints.
- **10–240 minutes per session**, **1–7 sessions per week**, and **1–40 lessons per generation request**.
- A master strategy generated before lessons, with optional reviews after blocks of up to five lessons.
- Saved original writing, exercise answers, notes, transcripts and separate AI feedback for later review.
- Explicit progress and recurring-error evidence that persists across agent conversations.
- Historical lesson plans preserved when preferences change.

A “cycle” is a numbered lesson batch, not a fixed four-week course. Review sessions are additional to the requested lesson count.

## CLI quick start — recommended

You need a local project copy, **Python 3.10+**, a text editor/Markdown viewer, and an installed, authenticated coding agent. Follow the [official Codex CLI setup](https://learn.chatgpt.com/docs/codex/cli) for installation and sign-in. The framework does not require installing `web/` dependencies or starting a server; individual agent installation methods may have their own requirements.

Clone the `lingua-flow` repository using GitHub's **Code** menu or extract the repository ZIP into a private study folder. Open a terminal in that folder, where `AGENTS.md` and `README.md` are located:

```bash
python3 tools/validate_project.py --project
codex
```

Paste this into Codex's interactive session:

```text
Read AGENTS.md and docs/CLI_GUIDE.md. Follow workflows/00-configure-learning.md.
Help me configure docs/LEARNER_PROFILE.md. Ask for my target language, goals,
self-reported level or uncertainty, weak points, interests, constraints,
session length, weekly frequency, batch size and optional reviews.
Do not invent preferences or assessment results. Save the documented JSON
format and validate its fields. Do not generate lessons or record progress yet.
```

Then follow this sequence; the [CLI guide](docs/CLI_GUIDE.md) supplies copyable prompts for every step:

| Step | Ask the agent to do | Files you inspect or create |
|---|---|---|
| Configure | Follow workflow 00 with your choices | `docs/LEARNER_PROFILE.md` |
| Plan strategy | Follow workflow 01; no lessons yet | `curriculum/master-curriculum.md`, `curriculum/resources.md` |
| Generate | Follow workflow 02; request 1 lesson or a batch | `study-plans/cycle-NNN/plan.md`, `overview.md`, session files |
| Study | Work independently; save answers and questions | `practice/notes/`, `practice/writing/`, `practice/speaking/` |
| Get feedback | Give exact artifact paths; preserve originals | New feedback under `practice/reviews/` |
| Record progress | Follow workflow 03 with what you actually completed | Authoritative records under `state/` |
| Review and continue | Follow workflow 04, then request the next batch | Updated handoff and the next numbered cycle |

**Where to put your work:** create files such as `practice/notes/C001-L01-notes.md`, `practice/writing/C001-L01-original.md`, and `practice/speaking/C001-L01-notes.md` in your editor. Save revisions separately. Give the agent these exact paths when asking for feedback. File existence does not automatically record completion or trigger review. See [manual notes and practice](docs/CLI_GUIDE.md#save-your-work-manually).

CLI agent edits go directly into the project under the CLI's permission controls; there is no web import step. Review files/diffs after tasks and keep private backups or checkpoints. Start fresh conversations in the same folder and ask the agent to read the profile, curriculum and state instead of rebuilding everything.

## Optional web interface

The React/Fastify app provides a local browser view over the same Markdown files: reading, search, notes, customization and progress forms. The framework remains usable without it. Its AI Agents feature has the [known issues above](#known-issues--read-before-using-the-web-interface); use direct CLI workflows for generation and review.

For the optional UI, install Node.js **22 or 24** with npm and run from the root:

```bash
npm --prefix web ci
npm --prefix web run dev
```

Open **http://127.0.0.1:5173**. Stop with `Ctrl+C`. Configure your profile through CLI first, or use the optional form. After changes from CLI, refresh the UI; avoid simultaneous edits.

A local production build uses `npm --prefix web run build` followed by `npm --prefix web start` at **http://127.0.0.1:4174**. The web app requires a local Node server and is not a static GitHub Pages site. It has no account authentication; do not expose it to the internet. See [web setup](web/README.md), [user guide](web/docs/user-guide.md) and [architecture/recovery](web/docs/architecture.md). Linux is tested; macOS and Windows are unverified.

## Data and privacy

Learning content lives in your project files. **AI tasks may send prompts and project context to the selected provider**; local storage does not mean offline AI processing. Provider access, billing and data handling follow that provider's terms.

Preferences, progress and generated content may be tracked by Git. `.gitignore` excludes app metadata, build output and common recordings, but **does not exclude all personal learning data**. Use a separate private study copy and inspect changes before pushing a public fork. Keep originals, feedback and revisions distinguishable. See [security guidance](SECURITY.md).

## Project map

| Path | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Repository instructions for the coding agent |
| [docs/CLI_GUIDE.md](docs/CLI_GUIDE.md) | Complete CLI learning workflow and prompts |
| [docs/LEARNER_PROFILE_SPEC.md](docs/LEARNER_PROFILE_SPEC.md) | Profile format; no UI required |
| [docs/](docs/) | Curriculum, lesson, evidence and resource specifications |
| [curriculum/](curriculum/) | Generated strategy and resource catalog |
| [study-plans/](study-plans/) | Historical lesson batches with counts and timing |
| [practice/](practice/) | Learner-created originals, notes, revisions and feedback |
| [state/](state/) | Authoritative progress and evidence |
| [templates/](templates/) and [workflows/](workflows/) | Reusable formats and agent procedures |
| [tools/validate_project.py](tools/validate_project.py) | Dependency-free structural validator |
| [web/](web/) | Optional UI and experimental agent integrations |

## Validation and development

For learning content, run from the root:

```bash
python3 tools/validate_project.py --project
# Only after this batch exists; substitute its actual number:
python3 tools/validate_project.py --cycle 001
```

Validation checks files, IDs and timing—not teaching quality, proficiency, profile JSON or source availability. Ask the agent to check the profile separately. Unchecked educational references must be labeled `UNVERIFIED` with a usable fallback.

For optional web development, follow [CONTRIBUTING.md](CONTRIBUTING.md). Tests use synthetic temporary projects and mock providers, not learner records or paid AI requests. See the [verification record](web/docs/verification.md); its automated results do not override the reported live web-agent failures.

## Contributing and support

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report bugs with synthetic examples, and follow [SECURITY.md](SECURITY.md) for security concerns. Maintainers can use the [publication checklist](docs/PUBLISHING.md).

## License

Copyright (C) 2026 Lingua Flow contributors.

This project's original code, documentation and templates are licensed under the **GNU General Public License, version 3 only** (`GPL-3.0-only`). See [LICENSE](LICENSE) for the complete terms and warranty disclaimer, or the [GNU GPLv3 reference](https://www.gnu.org/licenses/gpl-3.0.html).

Third-party dependencies and external learning resources retain their own licenses. This repository's license does not grant rights to redistribute referenced textbooks, audio or other third-party materials. Personal learner submissions are not contributed to this project merely by using the application.
