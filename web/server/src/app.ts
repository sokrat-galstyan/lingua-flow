import Fastify from "fastify";
import { z } from "zod";
import { Files, Mutex, AppError } from "./files.js";
import { project, recordProgress } from "./project.js";
import { Sessions } from "./agents/sessions.js";
import { CodexProvider } from "./agents/providers/codex.js";
import { ClaudeProvider } from "./agents/providers/claude.js";
import { preflight, workflows } from "./agents/workflows.js";
import type { Provider } from "./agents/provider.js";
import {
  preferencesSchema,
  formatPreferences,
} from "../../shared/preferences.js";
import { readPreferences } from "./preferences.js";
const text = z.string().max(10000);
const query = z.object({ path: z.string().max(500) });
export async function createApp(root: string, providers?: Provider[]) {
  const app = Fastify({ bodyLimit: 1100000, logger: false });
  const files = new Files(root);
  const lock = new Mutex();
  let eventStreams = 0;
  const sessions = new Sessions(
    files,
    providers || [new CodexProvider(), new ClaudeProvider()],
  );
  await sessions.init();
  app.addHook("onRequest", async (req, reply) => {
    const host = req.headers.host || "";
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))
      return reply.code(403).send({ message: "Localhost access only" });
    const origin = req.headers.origin;
    if (
      origin &&
      ![
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        `http://${host}`,
      ].includes(origin)
    )
      return reply.code(403).send({ message: "Origin rejected" });
    if (req.headers["sec-fetch-site"] === "cross-site")
      return reply.code(403).send({ message: "Cross-site request rejected" });
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers["x-english-client"] !== "1"
    )
      return reply.code(403).send({ message: "Missing local client header" });
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer")
      .header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
      );
  });
  app.setErrorHandler((error, _req, reply) => {
    const err = error as Error & { statusCode?: number; code?: string };
    const status =
      err instanceof z.ZodError
        ? 400
        : (err as any).code === "ENOENT"
          ? 404
          : err.statusCode || 500;
    reply.code(status).send({
      message:
        status === 500
          ? "Local operation failed; check file permissions and application logs."
          : err.message,
    });
  });
  app.get("/api/project", () => project(files));
  app.get("/api/documents", async (req) =>
    files.read(query.parse(req.query).path),
  );
  const mutable = async () => {
    await files.assertRecovered();
    if (sessions.busy())
      throw new AppError(
        409,
        "A mutating agent task is running or awaiting review. Finish it before editing.",
      );
  };
  app.get("/api/preferences", () => readPreferences(files));
  app.put("/api/preferences", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({ preferences: preferencesSchema, hash: z.string() })
        .parse(req.body);
      await files.write(
        "docs/LEARNER_PROFILE.md",
        formatPreferences(b.preferences),
        b.hash,
        true,
      );
      return readPreferences(files);
    }),
  );
  app.put("/api/documents", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({
          path: z.string(),
          content: z.string().max(1000000),
          hash: z.string().nullable(),
        })
        .parse(req.body);
      return files.write(b.path, b.content, b.hash);
    }),
  );
  app.post("/api/documents/rename", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({ path: z.string(), to: z.string(), hash: z.string() })
        .parse(req.body);
      const old = await files.read(b.path);
      if (!old.editable) throw new AppError(403, "Read-only document");
      if (old.hash !== b.hash)
        throw new AppError(409, "File changed before rename");
      const created = await files.write(b.to, old.content, null);
      await files.trash(b.path, b.hash);
      return created;
    }),
  );
  app.delete("/api/documents", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({ path: z.string(), hash: z.string() })
        .parse(req.body);
      return files.trash(b.path, b.hash);
    }),
  );
  app.post("/api/progress", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({
          id: z.string(),
          status: z.enum(["not-started", "in-progress", "completed"]),
          observation: text.default(""),
          grammar: text.default(""),
          expressions: text.default(""),
          speaking: text.default(""),
          writing: text.default(""),
          review: text.default(""),
          extraTime: text.default(""),
        })
        .parse(req.body);
      return recordProgress(files, b);
    }),
  );
  app.post("/api/mistakes", (req) =>
    lock.run(async () => {
      await mutable();
      const b = z
        .object({
          original: text.min(1),
          corrected: text.default(""),
          explanation: text.default(""),
          topic: text.default(""),
          lesson: text.default(""),
          review: z.enum(["needs-review", "reviewed"]).default("needs-review"),
        })
        .parse(req.body);
      const old = await files.read("state/recurring-mistakes.md");
      const entry =
        `\n## ${new Date().toISOString()} — Learner-recorded example\n\n` +
        Object.entries(b)
          .map(
            ([k, v]) => `- **${k}:** ${v.replace(/\n/g, " / ") || "unknown"}`,
          )
          .join("\n") +
        "\n- **Evidence:** self-report; frequency and correction accuracy unverified\n";
      return files.write(old.path, old.content + entry, old.hash, true);
    }),
  );
  app.get("/api/search", async (req) => {
    const q = z
      .object({ q: z.string().max(100) })
      .parse(req.query)
      .q.toLowerCase();
    if (!q) return [];
    const result = [];
    for (const d of await files.list()) {
      const content = (await files.read(d.path)).content;
      const index = content.toLowerCase().indexOf(q);
      if (index >= 0)
        result.push({
          ...d,
          snippet: content.slice(Math.max(0, index - 60), index + 160),
        });
      if (result.length >= 60) break;
    }
    return result;
  });
  app.get("/api/agents/providers", () =>
    Promise.all(sessions.providers.map((p) => p.detect())),
  );
  app.get("/api/agents/workflows", () => workflows);
  app.get("/api/agents/preflight", (req) =>
    preflight(
      files,
      z.object({ workflow: z.string() }).parse(req.query).workflow,
      z
        .object({
          lessonCount: z.coerce.number().int().min(1).max(40).optional(),
        })
        .parse(req.query).lessonCount,
    ),
  );
  app.get("/api/agents/sessions", () => sessions.list());
  app.post("/api/agents/sessions", (req) =>
    lock.run(() =>
      sessions.start(
        z
          .object({
            provider: z.string(),
            workflow: z.string(),
            prompt: text,
            context: z.string().optional(),
            token: z.string().optional(),
            override: z.boolean().optional(),
            resume: z.string().optional(),
            lessonCount: z.number().int().min(1).max(40).optional(),
          })
          .parse(req.body),
      ),
    ),
  );
  app.get<{ Params: { id: string } }>("/api/agents/sessions/:id", (req) =>
    sessions.get(req.params.id),
  );
  app.get<{ Params: { id: string } }>(
    "/api/agents/sessions/:id/changes",
    (req) => sessions.diff(req.params.id),
  );
  app.post<{ Params: { id: string } }>(
    "/api/agents/sessions/:id/apply",
    (req) => lock.run(() => sessions.apply(req.params.id)),
  );
  app.post<{ Params: { id: string } }>(
    "/api/agents/sessions/:id/cancel",
    (req) => sessions.cancel(req.params.id),
  );
  app.get<{ Params: { id: string } }>(
    "/api/agents/sessions/:id/events",
    async (req, reply) => {
      const s = sessions.get(req.params.id);
      if (eventStreams >= 10)
        throw new AppError(
          429,
          "Too many event streams; close other session tabs.",
        );
      eventStreams++;
      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
      });
      let last = Number(req.headers["last-event-id"] || 0);
      const send = () => {
        for (const e of s.events)
          if (e.seq > last) {
            reply.raw.write(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`);
            last = e.seq;
          }
        reply.raw.write(
          `event: status\ndata: ${JSON.stringify({ status: s.status })}\n\n`,
        );
      };
      send();
      const timer = setInterval(send, 500);
      reply.raw.on("close", () => {
        clearInterval(timer);
        eventStreams--;
      });
    },
  );
  app.addHook("onClose", () => sessions.close());
  return { app, files, sessions };
}
