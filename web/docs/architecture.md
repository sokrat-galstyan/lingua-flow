# Architecture and data contract

This document describes the optional web application. The file-based framework is primarily operated through [CLI workflows](../../docs/CLI_GUIDE.md) and does not require this server, staging layer or API. Web-agent execution has [reported unresolved issues](../../docs/KNOWN_ISSUES.md); implementation descriptions below are not evidence of live provider success.

## Modules

- `client/src/main.tsx`: React Router shell; `pages/` contains separate dashboard, curriculum, study, reader, workspace, search, progress and settings components; `components/` holds shared title/progress forms.
- `client/src/Markdown.tsx`: GFM, raw HTML parsing followed by sanitation, heading IDs, highlighting, project-relative links. Remote images are not loaded.
- `client/src/pages/Agents.tsx`: provider selection, workflow preview, SSE conversation, staged-file review.
- `server/src/files.ts`: centralized path/category policy, bounded discovery, content hashes, atomic writes, local trash, mutex.
- `server/src/project.ts`: Markdown metadata, unit/phase parsing, authoritative progress view and journaled recording.
- `server/src/agents/`: separate provider implementations, documented protocols, workflows, persisted sessions and staging/import.
- `server/src/app.ts`: Fastify API, input validation, localhost/origin checks, mutation serialization, SSE.
- `shared/types.ts`: cross-boundary types. No educational database exists.

## Ownership

| Category | Paths | Ordinary web operations |
|---|---|---|
| Educational | curriculum, study-plans, docs | Read only, except the dedicated learner customization action |
| Learner | Markdown beneath practice | Create, read, edit, rename, trash |
| Managed state | state | Read; dedicated progress/mistake actions |
| Configuration | AGENTS.md, README.md, workflows, templates | Read only |
| App-private | .english-web | No general document API access |

The backend enforces the policy. Unknown paths, non-Markdown files, absolute paths, traversal, backslashes, control characters, and symbolic links are rejected. Reads are capped at 1 MB per file and discovery at 5,000 documents. Writes use a same-directory temporary file and rename (new files use exclusive hard-link creation). Conflict hashes are checked before saving. A local user actively racing filesystem parent-directory replacement is outside this application's security boundary; do not treat this as a hostile multi-user file server.

## State compatibility

No progress index competes with Markdown. Existing active-cycle completion fields are parsed. Application entries append `- **Session status:** C001-L01 = completed` (or `in-progress` / `not-started`) to `state/learning-record.md`; later entries for the same ID take precedence. Unknown free-form reports are displayed but never converted into invented completions. Current-cycle fields and appended ledger rows stay readable by existing terminal workflows. Keep those workflows' explicit IDs and update their canonical fields consistently when modifying state externally.

Lesson/review identities are accepted only from matching canonical study-plan paths and headings; learner notes cannot become progress sessions.

All application mutations are serialized. A mutating agent proposal blocks ordinary editing until completed/discarded. Terminal writers cannot be locked; hash checks detect their changes before saving/import. Five-second project polling observes content titles, new files and state; document views re-read when the project revision changes. The editor keeps an unsaved draft and checks hashes on save.

### Interrupted state updates

Three-file progress updates cannot be atomically renamed as a group. Before writes, `.english-web/progress-pending.json` stores original content/hashes and all proposed content. On an incomplete update, document edits, state actions, new mutating agent tasks, and staged imports fail closed until recovery. Reading remains available. Stop the application, back up the journal and current files, compare each original/current/proposed value, and either finish the proposed values or restore all originals. Preserve independently added external evidence. Remove the journal only after all three files are reconciled, then run project validation and restart. This is an explicit manual recovery operation, not silent rollback.

Imports check every staged input against its original hash, including unchanged state and curriculum, so external edits require a fresh proposal.

Staged imports likewise retain `.english-web/import-SESSION.json` until every write finishes. If interrupted, stop the server, back up the journal, reconcile the listed changes, run project/cycle validation, then remove the journal. Staged source files remain available. Do not blindly retry a partially applied import.

## Agent execution

`Provider` exposes detection and a streaming run accepting an AbortSignal and optional resume ID. Adapters map actual protocol events to common response/progress/result events. The frontend never invokes executables. Arguments are arrays with `shell:false`. No arbitrary command endpoint exists. The server limits concurrent runs to three and mutations to one, with a one-hour timeout. Events are bounded (300 events, 2,000 characters each); use provider-native logs for long-task detail. Known credential patterns are redacted, but agent output must never be treated as an approved place to put secrets.

Mutations copy approved Markdown plus the trusted validator into `.english-web/staging/SESSION/`. Providers execute there with their supported permissions. This is a working copy, **not an independent OS security sandbox**. Codex adds its own sandbox; Claude restricts the tool set. Existing provider configurations are trusted local inputs.

After a mutating run, the server executes the original trusted Python validator in the stage and offers current/proposed content. Import permits only the workflow's destinations. Practice can create new `practice/generated/*.md`; cycles can create the next cycle and update resource catalog/current pointer/ledger; initialization can create missing curriculum and update those designated state/resource files. Historical cycles, specifications, and existing learner documents cannot be imported over. Deletions are rejected. No Git dependency is required. Generated proposals still need a learner's content review; structural validation is not educational quality assessment.

Sessions persist locally in `.english-web/sessions/`. Runs interrupted by a server restart are marked interrupted; they are never restarted automatically. Read-only continuations retain provider IDs. Failed/canceled staging copies are retained for diagnosis, with no automatic import. Stop the server before manually cleaning old session/staging files.

## API and network boundary

`/api/project`, `/api/documents`, `/api/search`, `/api/progress`, `/api/mistakes`, `/api/agents/providers`, `/api/agents/workflows`, `/api/agents/preflight`, `/api/agents/sessions` and session `events`, `changes`, `apply`, `cancel` routes provide the operations. Mutation requests require JSON and `X-English-Client: 1`. The server checks Host, Origin and Fetch Metadata, provides no permissive CORS, and binds IPv4 loopback only. Production headers include CSP, frame denial and no-referrer. Never expose this single-user server publicly without authentication, TLS, authorization and a separate threat review.

## Known scope limits

No arbitrary curriculum regeneration, in-browser tool approvals, audio playback/recording, database, automatic proficiency rating, historical-state editor, or provider credential manager. Long session logs are capped. Directory links/non-Markdown resources show an actionable read error. Exact curriculum metadata parsing targets this repository's Markdown conventions; incompatible formats should be repaired explicitly, not inferred.

## Customization and variable batches

`GET/PUT /api/preferences` reads/writes a schema-validated JSON block in `docs/LEARNER_PROFILE.md`. Writes share the mutation mutex, staging lock, recovery checks and content-hash conflict protection. Missing customization opens the onboarding form and blocks strategy/lesson generation. Level and weaknesses remain self-report.

Each new batch receives a server-created `plan.md` specifying lesson count, review count and session minutes. Preflight tokens bind the request count and preferences; the stored session binds the exact plan text, rechecked before import. Providers cannot redefine the requested workload. Counts range from 1–40, sessions 10–240 minutes, reviews optional per block of up to five lessons. Folder names retain `week-XX` for compatibility but represent navigation blocks; configured weekly frequency controls calendar pacing. Legacy cycles without plans retain 20/4/120. Completion checks the declared counts as well as explicit session evidence. Initialization must produce curriculum units and a ready/no-active-cycle state.

Tests seed synthetic units and lessons in temporary projects; they do not depend on personal study content. Preference changes affect future generation. A named curriculum revision still uses the terminal workflow.
