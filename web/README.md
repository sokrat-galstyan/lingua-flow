# Lingua Flow — optional web interface

The optional local, single-user UI for Lingua Flow, the CLI-first Markdown learning framework. It was added for convenient browsing and editing; configuration, curriculum/lesson generation and practice review do not depend on it. Start with the [CLI guide](../docs/CLI_GUIDE.md).

## Known issues

The user reports that the web **Codex** integration shows intermediate JSON instead of readable AI streaming and fails to complete tasks because of permissions. Claude Code was unavailable, so it was not checked. This report has not been investigated or fixed. Use the coding agent directly through CLI for generation and review; see the [known-issues record](../docs/KNOWN_ISSUES.md).

Reading, notes, search and progress forms operate on the same local files. The agent integration described below is experimental; automated mock tests do not establish live functionality.

## Install and run

Requirements: Node.js **22 or 24 LTS**, npm, and Python 3.10+ for project/cycle validation. Linux is the tested platform; macOS should work. Windows requires native provider executables on PATH (or WSL); cancellation uses `taskkill`. Windows and macOS are not verified here.

From the repository root:

```bash
npm --prefix web ci
npm --prefix web run dev
```

Open **http://127.0.0.1:5173**. Configure and generate through the [CLI workflow](../docs/CLI_GUIDE.md), then use this UI over the resulting files. The optional customization form edits the same profile, but its link to agent generation does not resolve the known issues. Fastify listens on 127.0.0.1:4174; Vite proxies `/api`. Both processes stop with Ctrl+C. No files are copied into the frontend.

Production:

```bash
npm --prefix web run build
npm --prefix web start
```

Open **http://127.0.0.1:4174**. The server discovers the project root from its own location, independently of the shell working directory. Set `ENGLISH_PROJECT_ROOT` to an absolute project root to use another compatible repository. The production client build must be in that project's `web/dist/client`. `PORT` changes the production API port. `ENGLISH_PYTHON` selects a Python executable (default `python3`; Windows may need `python`).

Configuration names such as `ENGLISH_PROJECT_ROOT`, `ENGLISH_PYTHON`, and the `.english-web/` metadata directory retain their original identifiers for compatibility. They are implementation details, not the project name.

## Checks

```bash
npm --prefix web test
npm --prefix web run check
npm --prefix web run build
npm exec --prefix web -- playwright install chromium
npm --prefix web run test:browser
npm --prefix web run smoke:agents
python3 tools/validate_project.py --project
```

Run `python3 tools/validate_project.py --cycle 001` only after that cycle exists.

`check` runs TypeScript and ESLint. Tests use temporary synthetic projects, never live learner content or progress. Browser tests start a separate server on port 4175 and inject a **test-only** mock adapter. No mock is registered by production. `smoke:agents` checks installation/authentication without requesting model output. For a tiny live request, explicitly set `RUN_AGENT_SMOKE=codex` (or `claude`); provider usage may be billed. Test results and screenshots go in ignored `web/test-results/`.

## Guides

- [User guide](docs/user-guide.md)
- [Provider integrations and limitations](docs/agents.md)
- [Architecture, ownership, and recovery](docs/architecture.md)
- [Verification record](docs/verification.md)

## Troubleshooting

- **Port in use:** stop the other development server; dev requires ports 5173 and 4174. Use `PORT` with production if necessary.
- **Missing project:** check `ENGLISH_PROJECT_ROOT`, `AGENTS.md`, and `docs/PROJECT_CONTRACT.md`.
- **409 conflict:** keep your draft, reload the external file, and merge changes. No automatic overwrite is offered.
- **Progress update interrupted:** follow the recovery procedure in the architecture guide; a journal deliberately blocks further progress updates.
- **Provider unavailable:** install/authenticate using its official terminal interface and reload AI Agents. Providers are optional for ordinary study.
- **Permission denied or intermediate JSON in an agent task:** see [known issues](../docs/KNOWN_ISSUES.md). Use direct CLI workflows; no fix or permission bypass is documented here.
- **Python unavailable:** install Python 3 or set `ENGLISH_PYTHON`; proposals cannot be imported until validation succeeds.
- **Broken document link:** the reader displays a recoverable error; use Search to find the intended document. Binary/audio files are not served by this application.
- **Partial generated cycle:** do not mark it completed. Keep the staging copy and repair via the existing workflow; failed tasks never import automatically.

Do not publish this server or bind it to an external interface. It is deliberately a localhost tool without account authentication. Keep backups of the repository and private practice files.
