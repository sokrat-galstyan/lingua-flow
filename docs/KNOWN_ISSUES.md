# Known issues

## Web interface: AI agent execution is not working reliably

User-reported behavior with the **Codex integration in the web interface**:

- The conversation displays intermediate JSON messages instead of readable AI response streaming.
- Agent tasks fail because of permissions and do not complete the requested work.

These symptoms were reported for Codex only. Claude Code was unavailable in the reporting environment, so its behavior is unknown. Do not infer that its integration works or shares the same failures.

The report is documented without investigation, reproduction, root-cause analysis or a fix. Prior mock/browser tests and an earlier minimal read-only provider request do not establish that real web-agent workflows work.

**Current usage path:** run a coding agent directly from the project root, following the [CLI guide](CLI_GUIDE.md), to configure learning, generate the curriculum and lessons, and review saved practice. The optional web interface can be used as a view/editor over the same files; it is not required for the framework. This recommendation does not diagnose or guarantee the permissions of any particular CLI installation.

Do not rely on a failed web task as evidence that files were generated or learning progress was saved. Use the authoritative project files and validation results. Existing app recovery guidance remains in the [architecture document](../web/docs/architecture.md).
