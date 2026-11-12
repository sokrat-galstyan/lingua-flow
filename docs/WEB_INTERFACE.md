# Optional local web interface

Lingua Flow is CLI-first: Markdown specifications, workflows, templates, curriculum, lessons and explicit learning records. The web application was added later as a convenient view/editor over these files. It is not required for setup, lesson generation, manual practice or AI review.

Start with the [CLI learning guide](CLI_GUIDE.md). You can run the framework without Node.js web dependencies or a browser server.

## Known issues

The user reports that the web Codex integration displays intermediate JSON instead of readable AI streaming and fails tasks because of permissions. Claude Code was unavailable and not checked. The issue is documented without investigation or a fix. Use direct CLI agent workflows; see [known issues](KNOWN_ISSUES.md).

## Optional UI setup

With Node.js 22 or 24 and npm, from the project root:

```bash
npm --prefix web ci
npm --prefix web run dev
```

Open http://127.0.0.1:5173. The UI reads curriculum, resources and study plans; edits learner Markdown under `practice/`; and provides profile/progress forms over the same files. Ordinary reading and manual notes do not require an AI agent. After CLI updates, refresh the UI and avoid conflicting edits.

The UI's AI generation controls are experimental and affected by the reported issue. Do not make them a prerequisite for learning.

See [web setup](../web/README.md), [the user guide](../web/docs/user-guide.md), [agent status](../web/docs/agents.md) and [architecture/recovery](../web/docs/architecture.md). The app remains localhost-only, not a hosted learning service.
