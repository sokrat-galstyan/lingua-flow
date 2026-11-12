import { promises as fs, constants } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { DocumentInfo } from "../../shared/types.js";
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function category(p: string): DocumentInfo["category"] {
  if (p.startsWith("practice/")) return "learner";
  if (p.startsWith("state/")) return "state";
  if (/^(curriculum|study-plans|docs)\//.test(p)) return "education";
  return "configuration";
}
export class Files {
  constructor(public root: string) {}
  async safe(p: string, internal = false) {
    if (
      !p ||
      p.includes("\\") ||
      path.isAbsolute(p) ||
      p
        .split("/")
        .some((s) => s === ".." || s === "." || !s || s.includes(":")) ||
      /[\x00-\x1f]/.test(p)
    )
      throw new AppError(400, "Invalid project path");
    if (
      !internal &&
      !/^(curriculum|study-plans|docs|workflows|templates|state|practice)\/.+\.md$/.test(
        p,
      ) &&
      !["README.md", "AGENTS.md"].includes(p)
    )
      throw new AppError(403, "Path is outside readable Markdown content");
    let current = this.root;
    for (const part of p.split("/")) {
      current = path.join(current, part);
      try {
        if ((await fs.lstat(current)).isSymbolicLink())
          throw new AppError(403, "Symbolic links are not supported");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
    }
    return current;
  }
  async assertRecovered() {
    let entries: string[];
    try {
      entries = await fs.readdir(await this.safe(".english-web", true));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
    if (
      entries.some(
        (name) =>
          name === "progress-pending.json" || /^import-.+\.json$/.test(name),
      )
    )
      throw new AppError(
        409,
        "An interrupted update needs recovery; see web/docs/architecture.md",
      );
  }
  async read(p: string, internal = false) {
    const full = await this.safe(p, internal);
    const handle = await fs.open(
      full,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      if ((await handle.stat()).size > 1024 * 1024)
        throw new AppError(413, "Document exceeds 1 MB");
      const content = await handle.readFile("utf8");
      return {
        path: p,
        content,
        hash: hash(content),
        editable: category(p) === "learner",
      };
    } finally {
      await handle.close();
    }
  }
  async write(
    p: string,
    content: string,
    expected: string | null,
    internal = false,
  ) {
    if (Buffer.byteLength(content) > 1024 * 1024)
      throw new AppError(413, "Document exceeds 1 MB");
    if (!internal && category(p) !== "learner")
      throw new AppError(403, "This document is read-only");
    const full = await this.safe(p, internal);
    let old: string | null = null;
    try {
      old = (await this.read(p, internal)).hash;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    if (old !== expected)
      throw new AppError(
        409,
        "File changed outside this editor. Reload and merge your changes.",
      );
    await fs.mkdir(path.dirname(full), { recursive: true });
    await this.safe(p, internal);
    const tmp = full + "." + randomUUID() + ".tmp";
    await fs.writeFile(tmp, content, { flag: "wx", mode: 0o600 });
    try {
      if (expected === null) {
        await fs.link(tmp, full);
        await fs.unlink(tmp);
      } else {
        if ((await this.read(p, internal)).hash !== expected)
          throw new AppError(409, "File changed during save");
        await fs.rename(tmp, full);
      }
    } catch (e) {
      await fs.unlink(tmp).catch(() => {});
      throw e;
    }
    return this.read(p, internal);
  }
  async list() {
    const result: DocumentInfo[] = [];
    const visit = async (dir: string) => {
      let entries;
      try {
        entries = await fs.readdir(await this.safe(dir, true), {
          withFileTypes: true,
        });
      } catch {
        return;
      }
      for (const e of entries) {
        if (e.isSymbolicLink() || e.name.startsWith(".")) continue;
        const p = dir + "/" + e.name;
        if (e.isDirectory()) await visit(p);
        else if (e.name.endsWith(".md")) {
          if (result.length >= 5000)
            throw new AppError(413, "Too many documents");
          try {
            result.push(metadata(p, (await this.read(p)).content));
          } catch {
            /* An unreadable file cannot break the browser. */
          }
        }
      }
    };
    for (const d of [
      "curriculum",
      "study-plans",
      "docs",
      "workflows",
      "templates",
      "state",
      "practice",
    ])
      await visit(d);
    for (const p of ["README.md", "AGENTS.md"])
      try {
        result.push(metadata(p, (await this.read(p)).content));
      } catch {
        /* optional in fixtures */
      }
    return result.sort((a, b) => a.path.localeCompare(b.path));
  }
  async trash(p: string, expected: string) {
    if (category(p) !== "learner")
      throw new AppError(403, "Only learner documents can be deleted");
    const doc = await this.read(p);
    if (doc.hash !== expected)
      throw new AppError(409, "File changed before deletion");
    const target =
      ".english-web/trash/" + Date.now() + "-" + randomUUID() + ".md";
    await this.write(
      target,
      `<!-- Original path: ${p} -->\n` + doc.content,
      null,
      true,
    );
    await fs.unlink(await this.safe(p));
    return { trash: target };
  }
}
function sessionId(p: string, content: string) {
  const match = p.match(
    /^study-plans\/cycle-(\d{3,})\/week-(0[1-8])\/(?:lesson-(\d{2})|review)\.md$/,
  );
  if (!match) return undefined;
  const [, cycle, week, lesson] = match;
  if (
    lesson &&
    (Number(lesson) < (Number(week) - 1) * 5 + 1 ||
      Number(lesson) > Number(week) * 5)
  )
    return undefined;
  const id = `C${cycle}-${lesson ? "L" + lesson : "R" + week}`;
  return content.match(/^#\s+(C\d+-[LR]\d+)\b/m)?.[1] === id ? id : undefined;
}
export function metadata(p: string, content: string): DocumentInfo {
  return {
    path: p,
    title: content.match(/^#\s+(.+)$/m)?.[1] || path.basename(p),
    category: category(p),
    contentHash: hash(content),
    id: sessionId(p, content),
    cycle: p.match(/cycle-\d+/)?.[0],
    week: p.match(/week-\d+/)?.[0],
    units: [...new Set(content.match(/U-\d{3,}/g) || [])],
  };
}
export class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.tail.then(fn, fn);
    this.tail = next.catch(() => {});
    return next;
  }
}
