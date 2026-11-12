import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, realpathSync } from "node:fs";
import { createApp } from "./app.js";
import staticFiles from "@fastify/static";
export function discoverRoot(start: string) {
  let current = path.resolve(start);
  while (true) {
    if (
      existsSync(path.join(current, "AGENTS.md")) &&
      existsSync(path.join(current, "docs/PROJECT_CONTRACT.md"))
    )
      return realpathSync(current);
    const parent = path.dirname(current);
    if (parent === current)
      throw new Error("Project root not found. Set ENGLISH_PROJECT_ROOT.");
    current = parent;
  }
}
const root = discoverRoot(
  process.env.ENGLISH_PROJECT_ROOT ||
    path.dirname(fileURLToPath(import.meta.url)),
);
const { app } = await createApp(root);
const client = path.join(root, "web/dist/client");
if (existsSync(client)) {
  await app.register(staticFiles, { root: client });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith("/api/")
      ? reply.code(404).send({ message: "Not found" })
      : reply.sendFile("index.html"),
  );
}
await app.listen({ host: "127.0.0.1", port: Number(process.env.PORT || 4174) });
console.log(
  "Lingua Flow: http://127.0.0.1:" + (process.env.PORT || 4174),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
