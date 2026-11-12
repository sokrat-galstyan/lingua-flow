import {
  probe,
  exec,
  executable,
  cliRun,
  type Provider,
  type RunOptions,
} from "../provider.js";
export class ClaudeProvider implements Provider {
  id = "claude";
  async detect() {
    const s = await probe("claude", "Claude Code", [
      "--output-format",
      "--resume",
      "--tools",
      "--permission-mode",
    ]);
    if (s.installed)
      try {
        const { stdout } = await exec(
          executable("claude"),
          ["auth", "status"],
          { timeout: 5000, maxBuffer: 10000 },
        );
        const auth = JSON.parse(stdout);
        s.authentication = auth.loggedIn ? "ready" : "not authenticated";
        if (!auth.loggedIn) s.available = false;
      } catch {
        s.authentication = "unknown — run claude auth login";
      }
    return s;
  }
  async run(o: RunOptions) {
    const args = [
      "-p",
      o.prompt,
      "--output-format",
      "stream-json",
      "--verbose",
      "--permission-mode",
      "dontAsk",
      "--tools",
      o.mutating ? "Read,Glob,Grep,Write,Edit" : "Read,Glob,Grep",
      "--allowedTools",
      o.mutating ? "Read,Glob,Grep,Write,Edit" : "Read,Glob,Grep",
    ];
    if (o.resume) args.push("--resume", o.resume);
    await cliRun("claude", args, o);
  }
}
