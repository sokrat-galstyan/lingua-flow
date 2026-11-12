import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { existsSync } from "node:fs";
export function executable(id: string) {
  const configured = process.env["ENGLISH_" + id.toUpperCase() + "_BIN"];
  if (configured) {
    if (!path.isAbsolute(configured))
      throw new Error("Provider binary override must be an absolute path");
    return configured;
  }
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (dir.includes("node_modules")) continue;
    for (const ext of process.platform === "win32"
      ? [".exe", ".cmd", ""]
      : [""]) {
      const candidate = path.join(dir, id + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return id;
}
import type { ProviderStatus } from "../../../shared/types.js";
export const exec = promisify(execFile);
export interface RunOptions {
  cwd: string;
  prompt: string;
  mutating: boolean;
  resume?: string;
  signal: AbortSignal;
  emit: (type: string, text: string) => void;
  session: (id: string) => void;
}
export interface Provider {
  id: string;
  detect(): Promise<ProviderStatus>;
  run(options: RunOptions): Promise<void>;
}
export const capabilities = {
  streaming: true,
  continuation: true,
  cancellation: true,
  approvals: false,
  readOnly: true,
  mutation: true,
};
export function redact(s: string) {
  return s
    .replace(/\b(?:sk-[\w-]{12,}|AIza[\w-]{20,})\b/g, "[redacted]")
    .replace(
      /((?:api[_-]?key|authorization|access_token|refresh_token)\s*[=:]\s*)[^\s,}]+/gi,
      "$1[redacted]",
    )
    .slice(0, 16000);
}
export async function probe(
  id: string,
  name: string,
  flags: string[],
  readOnly = true,
): Promise<ProviderStatus> {
  let version = "",
    help = "";
  try {
    version = (
      await exec(executable(id), ["--version"], {
        timeout: 5000,
        maxBuffer: 100000,
      })
    ).stdout.trim();
    help = (
      await exec(executable(id), ["--help"], {
        timeout: 5000,
        maxBuffer: 200000,
      })
    ).stdout;
  } catch {
    return {
      id,
      name,
      installed: false,
      available: false,
      version,
      authentication: "unknown",
      reason: `Install ${name} using its official documentation, authenticate in a terminal, then refresh.`,
      capabilities: { ...capabilities, readOnly },
    };
  }
  const available = flags.every((f) => help.includes(f));
  return {
    id,
    name,
    installed: true,
    available,
    version,
    authentication: "unknown — authenticate in the provider CLI",
    reason: available
      ? "Interactive approvals are unavailable; denied operations are reported."
      : "Installed version lacks required documented flags. Update the CLI.",
    capabilities: { ...capabilities, readOnly },
  };
}
export function normalize(e: any): {
  type: string;
  text: string;
  session?: string;
  done?: boolean;
  failed?: boolean;
} {
  const contents = e.message?.content;
  return {
    type:
      e.type === "assistant"
        ? "response"
        : e.type === "result"
          ? "result"
          : "progress",
    text: Array.isArray(contents)
      ? contents
          .map(
            (c: any) =>
              c.text || (c.type === "tool_use" ? `Tool: ${c.name}` : ""),
          )
          .join("\n")
      : e.result ||
        e.error ||
        e.event?.delta?.text ||
        e.subtype ||
        e.type ||
        "event",
    session: e.session_id,
    done: e.type === "result",
    failed: !!e.is_error || (e.permission_denials?.length || 0) > 0,
  };
}
export async function cliRun(
  providerId: string,
  args: string[],
  o: RunOptions,
) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable(providerId), args, {
      cwd: o.cwd,
      shell: false,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let buffer = "",
      size = 0,
      done = false,
      failed = false,
      settled = false;
    let killTimer: NodeJS.Timeout | undefined;
    const kill = () => {
      if (!child.pid) return;
      try {
        if (process.platform === "win32")
          spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
            shell: false,
          });
        else process.kill(-child.pid, "SIGTERM");
      } catch {}
      killTimer = setTimeout(() => {
        try {
          if (child.pid && process.platform !== "win32")
            process.kill(-child.pid, "SIGKILL");
        } catch {}
      }, 2000);
      killTimer.unref();
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      o.signal.removeEventListener("abort", kill);
      if (killTimer && !o.signal.aborted) clearTimeout(killTimer);
      if (error) reject(error);
      else resolve();
    };
    o.signal.addEventListener("abort", kill, { once: true });
    if (o.signal.aborted) kill();
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) {
        failed = true;
        kill();
        return;
      }
      buffer += chunk.toString();
      let n;
      while ((n = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, n);
        buffer = buffer.slice(n + 1);
        if (!line.trim()) continue;
        try {
          const e = normalize(JSON.parse(line));
          if (e.session) o.session(e.session);
          o.emit(e.type, e.text);
          done ||= !!e.done;
          failed ||= !!e.failed;
        } catch {
          failed = true;
          o.emit("error", "Invalid machine-readable provider output");
          kill();
        }
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = redact(chunk.toString());
      if (/denied|authentication required/i.test(text)) failed = true;
      o.emit("warning", text);
    });
    child.on("error", finish);
    child.on("close", (code) =>
      finish(
        o.signal.aborted
          ? new Error("Canceled")
          : code !== 0 || failed || !done
            ? new Error(
                `Provider did not confirm successful completion (exit ${code}). Check diagnostics and permissions.`,
              )
            : undefined,
      ),
    );
  });
}
