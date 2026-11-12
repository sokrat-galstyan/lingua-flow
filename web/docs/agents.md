# Experimental web-agent integrations

These adapters belong to the optional UI. The framework’s primary agent interface is a direct CLI session; see the [CLI learning guide](../../docs/CLI_GUIDE.md).

## Known issues and current usage

The user reports that the **web Codex integration** displays intermediate JSON rather than readable streaming output and cannot complete tasks because of permissions. Claude Code was unavailable and not checked. This is documented without investigation or a fix. Use Codex CLI directly for learning workflows; see [known issues](../../docs/KNOWN_ISSUES.md).

The implementation descriptions and earlier limited checks below do not establish working live web-agent workflows. No supported workaround inside the web agent is claimed.

All adapters use real server-side interfaces. Installed/authenticated is distinct from a verified successful task. Automated tests inject mocks only into test servers. No simulated provider is exposed by the production application.

| Provider | Execution | Continuation | Permissions | Verification |
|---|---|---|---|---|
| OpenAI Codex | Official `@openai/codex-sdk`, streamed thread events | SDK resume ID; read-only conversations | `read-only` or staged `workspace-write`, no network grant, approval policy `never` (requests denied; sandbox retained) | Earlier minimal read-only request passed; current user report: JSON display and permission failures in web tasks, unresolved |
| Claude Code | Documented `-p --output-format stream-json --verbose` | `--resume`, read-only conversations | `dontAsk`; Read/Glob/Grep only, plus Write/Edit for staged mutations; no Bash tool | CLI unavailable here; adapter/event handling tested with mocks, live execution UNVERIFIED |

## Install and authenticate

Follow the providers' official installation instructions. The app does not install providers, collect credentials or change global permission configuration.

- [Codex SDK documentation](https://learn.chatgpt.com/docs/codex-sdk): install Codex CLI using the linked CLI setup, then run `codex login` in a terminal. Readiness uses `codex login status` without returning its output to the browser.
- [Claude Code setup](https://code.claude.com/docs/en/setup): install Claude Code, then `claude auth login`. Detection checks the documented help flags and attempts `claude auth status`; unknown authentication is shown explicitly.

The server searches PATH outside `node_modules` so an SDK's bundled executable cannot silently shadow the user's installed version. Optional absolute binary overrides are `ENGLISH_CODEX_BIN` and `ENGLISH_CLAUDE_BIN`. Restart after changing environment variables. The app checks required flags; unsupported CLI versions remain disabled. Native Windows executables or WSL are recommended; `.cmd` shim behavior is not verified.

## Provider terms

The repository contains integration code, not provider accounts or a bundled Claude Code binary. Users install the official tools separately and authenticate through their own provider accounts. This project is independent and is not endorsed by OpenAI or Anthropic.

Provider access remains subject to the provider's terms. In particular, [Anthropic's integration conditions](https://code.claude.com/docs/en/legal-and-compliance) require its Commercial Terms when offering Claude Code in a product or service, an unmodified binary, and each user's own authentication and billing. Do not collect subscription tokens, provide a custom Claude.ai login, or resell/intermediate users' usage. Publishing this repository does not grant provider service or redistribution rights.

## Capability differences and limitations

Codex SDK was selected because it provides typed threads, streaming, resumption, and cancellation with modest integration complexity. The [Codex app-server](https://learn.chatgpt.com/docs/codex-app-server) supports richer client approval/authentication/history handling; adopting that protocol is a separate extension. This release explicitly does **not** offer interactive approvals. `never` denies escalation instead of approving it, while keeping the selected sandbox enabled. An environment unable to run that sandbox must be fixed externally; the app does not bypass it.

Claude output is NDJSON, never decorated terminal text. Only explicitly selected tools are enabled. Inspect configured provider hooks/plugins before using the CLI; local provider configuration is trusted. The app does not enable Bash or bypass permission checks. Agent-side validators that need shell execution may be denied; the server independently runs the trusted project validator on proposals.


Long output is intentionally bounded in the local web history. Raw responses may contain sensitive learning content; session files are private local metadata and are ignored by Git. Known credential-shaped strings are redacted. Never paste a secret into a prompt.

## Sessions, cancellation, and recovery

SSE streams normalized events; persisted session history reopens after restart. Continued read-only messages create a new execution record while retaining the same native conversation ID. Mutations always use a fresh stage. A provider may reject an old session after an upgrade; start a fresh conversation if so.

Stop uses SDK AbortSignal or process-group termination (with forceful fallback), including Windows `taskkill /T`. No task is automatically relaunched after restart. Interrupted and failed stages remain for inspection. Validation or unsupported/denied operations produce visible failures. To retry a failed generation, inspect the retained stage and use the existing terminal repair workflow; do not assume all requested tool actions succeeded.

## Tests

`npm --prefix web run smoke:agents` detects versions and readiness without paid requests. On POSIX, `RUN_AGENT_SMOKE=codex npm --prefix web run smoke:agents` makes one small read-only request; for PowerShell set `$env:RUN_AGENT_SMOKE='codex'` first. Do not use smoke tests to validate generation: only deliberate learning workflows should create educational files.
