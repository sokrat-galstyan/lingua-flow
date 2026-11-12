import { CodexProvider } from "../server/src/agents/providers/codex.js";
import { ClaudeProvider } from "../server/src/agents/providers/claude.js";
for (const p of [new CodexProvider(), new ClaudeProvider()]) {
  const status = await p.detect();
  console.log(JSON.stringify(status));
  if (
    process.env.RUN_AGENT_SMOKE === p.id &&
    status.available &&
    status.capabilities.readOnly
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      await p.run({
        cwd: process.cwd(),
        prompt:
          "Respond with exactly: Ready. Do not use tools or modify files.",
        mutating: false,
        signal: controller.signal,
        emit: (type, text) => console.log(type, text),
        session: (id) => console.log("Session created", !!id),
      });
      console.log("LIVE SMOKE PASS", p.id);
    } catch (e) {
      console.error("LIVE SMOKE FAILED", (e as Error).message);
      process.exitCode = 1;
    } finally {
      clearTimeout(timer);
    }
  }
}
