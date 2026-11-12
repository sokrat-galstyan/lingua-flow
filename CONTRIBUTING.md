# Contributing to Lingua Flow

Contributions that make the framework more useful, reliable and accessible are welcome. This is an early prototype; open an issue before undertaking large architectural changes so the scope can be discussed.

## Getting started

1. Fork or clone the repository and create a branch for your change.
2. Read [AGENTS.md](AGENTS.md) and the [project contract](docs/PROJECT_CONTRACT.md). For application work, also read [web/README.md](web/README.md) and [architecture and recovery](web/docs/architecture.md).
3. For framework/docs work, use the [CLI guide](docs/CLI_GUIDE.md) and Python validator; no web setup is required. For web development, install dependencies with `npm --prefix web ci` and start with `npm --prefix web run dev`.
4. Use synthetic learner data. Keep your personal study copy separate from your contribution checkout.

## Design expectations

- Keep self-study, learner customization and independently executable lessons central.
- Preserve Markdown as the authoritative learning store. Learner artifacts belong under `practice/`; CLI-managed preferences, progress and generated content follow their workflows. The optional UI uses dedicated actions for protected data.
- Distinguish generated, started, completed and mastered. Do not invent assessment results.
- Preserve historical lessons and learner artifacts; review direct CLI edits in files/diffs and web-generated changes through staging/import.
- Keep providers optional for ordinary study. Automated tests must not call paid services or require credentials.
- Respect source licenses. Mark unchecked educational references `UNVERIFIED` and provide usable fallbacks.

## Validation

For documentation/framework changes, run `python3 tools/validate_project.py --project` and check changed links/examples. For application changes, run all checks from the repository root:

```bash
npm --prefix web test
npm --prefix web run check
npm --prefix web run build
python3 tools/validate_project.py --project
```

For interface changes, build first, then run the browser suite:

```bash
cd web
npx playwright install chromium
npm run test:browser
```

Tests must use temporary synthetic projects, never actual learner records. Add focused regression coverage for meaningful behavior changes. Validate any generated batch separately with `python3 tools/validate_project.py --cycle NNN`.

## Pull requests

Explain the problem, resulting behavior and validation performed. Include screenshots for visible interface changes using synthetic data. Keep documentation and workflow contracts aligned with code changes. Mention limitations and unverified provider behavior rather than claiming unsupported success.

Review the diff for credentials, personal paths, learner content, recordings and provider logs before submitting. Do not include `node_modules`, build output or `.english-web` metadata.

By submitting a contribution, you agree to license your original contribution under this project's [GPL-3.0-only license](LICENSE). Submit only material you have the right to contribute, and preserve applicable third-party notices.

Be respectful and specific in discussions. Critique ideas and behavior, not people. For security issues, follow [SECURITY.md](SECURITY.md) instead of posting sensitive reproduction details publicly.
