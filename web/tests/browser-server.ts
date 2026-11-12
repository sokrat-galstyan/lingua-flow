import { promises as fs } from "node:fs";
import path from "node:path";
import staticFiles from "@fastify/static";
import { createApp } from "../server/src/app.js";
import {
  capabilities,
  type Provider,
  type RunOptions,
} from "../server/src/agents/provider.js";
import { fixture, source } from "./fixture.js";
const root = await fixture();
class BrowserMock implements Provider {
  id = "codex";
  async detect() {
    return {
      id: this.id,
      name: "Codex (browser test mock)",
      installed: true,
      available: true,
      version: "fixture",
      authentication: "test-only",
      reason: "No live model calls",
      capabilities,
    };
  }
  async run(o: RunOptions) {
    o.session("browser-conversation");
    o.emit("response", "Here is a useful practice explanation.");
    await new Promise((r) => setTimeout(r, 800));
    o.emit("response", "Practice one original sentence.");
  }
}
const { app } = await createApp(root, [new BrowserMock()]);
await app.register(staticFiles, { root: path.join(source, "web/dist/client") });
app.setNotFoundHandler((req, reply) =>
  req.url.startsWith("/api/")
    ? reply.code(404).send({ message: "Not found" })
    : reply.sendFile("index.html"),
);
app.post("/api/test/fresh", async () => {
  await fs.writeFile(path.join(root, "docs/LEARNER_PROFILE.md"), "# Not configured\n");
  await fs.rm(path.join(root, "curriculum/master-curriculum.md"));
  return { ok: true };
});
// Fixture mutation only: the production application never registers this endpoint.
app.post("/api/test/discover", async () => {
  await fs.mkdir(path.join(root, "study-plans/cycle-002"), { recursive: true });
  await fs.writeFile(
    path.join(root, "study-plans/cycle-002/overview.md"),
    "# Cycle 002 — Browser fixture",
  );
  return { ok: true };
});
await app.listen({ host: "127.0.0.1", port: 4175 });
const close = async () => {
  await app.close();
  await fs.rm(root, { recursive: true, force: true });
  process.exit(0);
};
process.on("SIGTERM", () => {
  void close();
});
process.on("SIGINT", () => {
  void close();
});
