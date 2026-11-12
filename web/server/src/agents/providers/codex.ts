import { Codex } from "@openai/codex-sdk";
import {
  probe,
  exec,
  executable,
  type Provider,
  type RunOptions,
} from "../provider.js";
export class CodexProvider implements Provider {
  id = "codex";
  async detect() {
    const s = await probe("codex", "OpenAI Codex", ["exec"]);
    if (s.installed) {
      try {
        await exec(executable("codex"), ["login", "status"], {
          timeout: 5000,
          maxBuffer: 10000,
        });
        s.authentication = "ready";
      } catch {
        s.authentication = "not authenticated";
        s.available = false;
        s.reason = "Run codex login in a terminal.";
      }
    }
    return s;
  }
  async run(o: RunOptions) {
    const codex = new Codex({ codexPathOverride: executable("codex") });
    const options = {
      workingDirectory: o.cwd,
      sandboxMode: o.mutating
        ? ("workspace-write" as const)
        : ("read-only" as const),
      approvalPolicy: "never" as const,
      networkAccessEnabled: false,
      skipGitRepoCheck: true,
    };
    const thread = o.resume
      ? codex.resumeThread(o.resume, options)
      : codex.startThread(options);
    const { events } = await thread.runStreamed(o.prompt, { signal: o.signal });
    let done = false;
    for await (const e of events) {
      if (e.type === "thread.started") o.session(e.thread_id);
      if (e.type === "turn.failed") throw new Error(e.error.message);
      if (e.type === "error") throw new Error(e.message);
      if (e.type === "turn.completed") done = true;
      if ("item" in e) {
        const i = e.item;
        if (i.type === "agent_message") o.emit("response", i.text);
        else if (i.type === "command_execution") {
          o.emit(e.type, i.command + "\n" + i.aggregated_output);
          if (i.status === "failed")
            o.emit(
              "warning",
              "A tool command failed. Review the response before relying on it.",
            );
        } else o.emit(e.type, JSON.stringify(i));
      }
    }
    if (!done) throw new Error("Codex stream ended without turn completion");
  }
}
