import { field } from "../project.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError, Files, Mutex } from "../files.js";
import { exec, redact, type Provider } from "./provider.js";
import { preflight, promptFor, workflows } from "./workflows.js";
import type { Session } from "../../../shared/types.js";
interface Stored extends Session {
  baseline?: Record<string, string>;
  next?: string;
  stage?: string;
  validation?: string;
  plan?: string;
}
export class Sessions {
  sessions = new Map<string, Stored>();
  running = new Map<string, AbortController>();
  private saves = new Mutex();
  constructor(
    public files: Files,
    public providers: Provider[],
  ) {}
  async init() {
    let list: string[] = [];
    try {
      list = await fs.readdir(
        await this.files.safe(".english-web/sessions", true),
      );
    } catch {}
    for (const name of list.filter((n) => /^[\w-]+\.json$/.test(n))) {
      try {
        const s = JSON.parse(
          (await this.files.read(".english-web/sessions/" + name, true))
            .content,
        ) as Stored;
        if (s.status === "running") s.status = "interrupted";
        this.sessions.set(s.id, s);
      } catch {
        /* retain unreadable session file for recovery */
      }
    }
  }
  busy() {
    return [...this.sessions.values()].some(
      (s) => s.mutating && ["running", "review"].includes(s.status),
    );
  }
  async save(s: Stored) {
    return this.saves.run(async () => {
      const p = `.english-web/sessions/${s.id}.json`;
      const old = await this.files.read(p, true).catch(() => null);
      await this.files.write(p, JSON.stringify(s), old?.hash || null, true);
    });
  }
  list() {
    return [...this.sessions.values()].sort((a, b) =>
      b.created.localeCompare(a.created),
    );
  }
  get(id: string) {
    const s = this.sessions.get(id);
    if (!s) throw new AppError(404, "Session not found");
    return s;
  }
  async start(input: {
    provider: string;
    workflow: string;
    prompt: string;
    context?: string;
    token?: string;
    override?: boolean;
    resume?: string;
    lessonCount?: number;
  }) {
    const w = workflows.find((w) => w.id === input.workflow);
    if (!w) throw new AppError(400, "Unknown workflow");
    if (w.mutating) await this.files.assertRecovered();
    if (this.running.size >= 3 || (w.mutating && this.busy()))
      throw new AppError(
        409,
        "Finish or discard the current mutating task first",
      );
    const provider = this.providers.find((p) => p.id === input.provider);
    if (!provider) throw new AppError(400, "Unknown provider");
    const ready = await provider.detect();
    if (!ready.available) throw new AppError(409, ready.reason);
    if (!w.mutating && !ready.capabilities.readOnly)
      throw new AppError(
        409,
        "This provider cannot enforce read-only tasks; select Codex or Claude.",
      );
    const check = await preflight(this.files, w.id, input.lessonCount);
    if (check.blocked) throw new AppError(409, check.blocked);
    if (w.mutating && input.token !== check.token)
      throw new AppError(
        409,
        "Review a fresh workflow preview before confirming",
      );
    if (check.override && !input.override)
      throw new AppError(
        409,
        "Active cycle is unfinished. Explicit override required.",
      );
    const previous = input.resume ? this.get(input.resume) : undefined;
    if (
      previous &&
      (previous.provider !== provider.id ||
        previous.mutating ||
        w.mutating ||
        !previous.providerSessionId ||
        this.running.has(previous.id))
    )
      throw new AppError(
        409,
        "Only idle read-only conversations can be continued",
      );
    const s: Stored = {
      id: randomUUID(),
      provider: provider.id,
      workflow: w.id,
      status: "running",
      created: new Date().toISOString(),
      events: previous ? [...previous.events] : [],
      providerSessionId: previous?.providerSessionId,
      mutating: w.mutating,
      next: check.next,
      plan: w.id === "cycle" ? check.plan : undefined,
    };
    this.sessions.set(s.id, s);
    const controller = new AbortController();
    this.running.set(s.id, controller);
    try {
      let cwd = this.files.root;
      if (w.mutating) {
        s.stage = `.english-web/staging/${s.id}`;
        cwd = await this.files.safe(s.stage, true);
        await fs.mkdir(cwd, { recursive: true });
        const stage = new Files(cwd);
        s.baseline = {};
        for (const doc of await this.files.list()) {
          const content = await this.files.read(doc.path);
          s.baseline[doc.path] = content.hash;
          await stage.write(doc.path, content.content, null, true);
        }
        if (s.plan)
          await stage.write(
            `study-plans/cycle-${s.next}/plan.md`,
            s.plan,
            null,
            true,
          );
        await fs.mkdir(path.join(cwd, "study-plans"), { recursive: true });
        await fs.mkdir(path.join(cwd, "tools"), { recursive: true });
        await fs.copyFile(
          await this.files.safe("tools/validate_project.py", true),
          path.join(cwd, "tools/validate_project.py"),
        );
        await fs.mkdir(path.join(cwd, "practice/writing"), { recursive: true });
        await fs.mkdir(path.join(cwd, "practice/speaking"), {
          recursive: true,
        });
      }
      const prompt = await promptFor(this.files, input, check.next);
      await this.save(s);
      void this.execute(s, provider, cwd, prompt, input.prompt, controller);
      return s;
    } catch (e) {
      this.running.delete(s.id);
      s.status = "failed";
      await this.save(s);
      throw e;
    }
  }
  private async execute(
    s: Stored,
    provider: Provider,
    cwd: string,
    prompt: string,
    user: string,
    controller: AbortController,
  ) {
    const emit = (type: string, text: string) => {
      if (s.events.length >= 300) s.events.shift();
      s.events.push({
        seq: (s.events.at(-1)?.seq || 0) + 1,
        type,
        text: redact(text).slice(0, 2000),
        at: new Date().toISOString(),
      });
    };
    emit("user", user);
    const interval = setInterval(() => {
      void this.save(s).catch(() => {});
    }, 2000);
    const timeout = setTimeout(() => controller.abort(), 60 * 60 * 1000);
    try {
      await provider.run({
        cwd,
        prompt,
        mutating: s.mutating,
        resume: s.providerSessionId,
        signal: controller.signal,
        emit,
        session: (id) => {
          s.providerSessionId = id;
        },
      });
      if (controller.signal.aborted) throw new Error("Canceled");
      if (s.mutating) {
        const diff = await this.diff(s.id);
        s.changes = diff.map((d) => d.path);
        await this.validate(s, cwd);
        if (controller.signal.aborted) throw new Error("Canceled");
        s.status = "review";
        emit(
          "files",
          "Validation passed. Review proposed files before importing.",
        );
      } else s.status = "completed";
    } catch (e) {
      s.status = controller.signal.aborted ? "canceled" : "failed";
      emit("error", (e as Error).message);
    } finally {
      clearInterval(interval);
      clearTimeout(timeout);
      emit(s.status, s.status);
      await this.save(s).catch(() => {});
      this.running.delete(s.id);
    }
  }
  async validate(s: Stored, cwd: string) {
    const script = await this.files.safe("tools/validate_project.py", true);
    const code = await fs.readFile(script, "utf8");
    const stage = new Files(cwd);
    const validator = await stage.safe("tools/validate_project.py", true);
    await fs.writeFile(validator, code);
    const args = [validator, "--project"];
    if (s.workflow === "cycle") args.push("--cycle", s.next!);
    const { stdout } = await exec(
      process.env.ENGLISH_PYTHON || "python3",
      args,
      { cwd, timeout: 30000, maxBuffer: 200000 },
    );
    if (s.workflow === "cycle") {
      if (
        (await stage.read(`study-plans/cycle-${s.next}/plan.md`)).content !==
        s.plan
      )
        throw new AppError(
          409,
          "Generated plan differs from the approved request.",
        );
      const current = (await stage.read("state/current-cycle.md")).content;
      if (
        field(current, "Active cycle") !== `cycle-${s.next}` ||
        field(current, "Status") !== "planned"
      )
        throw new AppError(
          409,
          "Generated cycle must have a planned active-cycle pointer before import.",
        );
      if (
        /C\d+-[LR]\d+/.test(
          field(current, "Completed lesson IDs in active cycle") +
            " " +
            field(current, "Completed weekly review IDs in active cycle"),
        )
      )
        throw new AppError(
          409,
          "Generation must not claim learner completions.",
        );
      const ledger = (await stage.read("state/cycle-ledger.md")).content;
      if (!ledger.includes(`| cycle-${s.next} |`))
        throw new AppError(409, "Generated cycle is missing its ledger entry.");
    }
    if (s.workflow === "initialize") {
      const master = await stage.read("curriculum/master-curriculum.md");
      if (!/^### U-\d+/m.test(master.content))
        throw new AppError(
          409,
          "Master curriculum must contain curriculum units.",
        );
      const current = (await stage.read("state/current-cycle.md")).content;
      if (
        field(current, "Status") !== "ready" ||
        field(current, "Active cycle") !== "none"
      )
        throw new AppError(
          409,
          "Initialization must leave the project ready with no active cycle.",
        );
    }
    s.validation = stdout;
  }
  allowed(s: Stored, p: string, existed: boolean) {
    if (s.workflow === "practice")
      return !existed && p.startsWith("practice/generated/");
    if (s.workflow === "cycle")
      return (
        (p.startsWith(`study-plans/cycle-${s.next}/`) && !existed) ||
        [
          "curriculum/resources.md",
          "state/current-cycle.md",
          "state/cycle-ledger.md",
        ].includes(p)
      );
    if (s.workflow === "initialize")
      return (
        (!existed && p.startsWith("curriculum/")) ||
        [
          "curriculum/resources.md",
          "state/current-cycle.md",
          "state/cycle-ledger.md",
        ].includes(p)
      );
    return false;
  }
  async diff(id: string) {
    const s = this.get(id);
    if (!s.stage) throw new AppError(400, "No staged files");
    const stage = new Files(await this.files.safe(s.stage, true));
    const docs = await stage.list();
    const changes = [];
    for (const doc of docs) {
      const after = await stage.read(doc.path);
      if (s.baseline?.[doc.path] !== after.hash) {
        const before = await this.files.read(doc.path).catch(() => null);
        changes.push({
          path: doc.path,
          before: before?.content || "",
          after: after.content,
          allowed: this.allowed(s, doc.path, !!s.baseline?.[doc.path]),
        });
      }
    }
    for (const p of Object.keys(s.baseline || {}))
      if (!docs.some((d) => d.path === p))
        changes.push({
          path: p,
          before: "Existing file",
          after: "[deleted]",
          allowed: false,
        });
    return changes;
  }
  async apply(id: string) {
    await this.files.assertRecovered();
    const s = this.get(id);
    if (s.status !== "review")
      throw new AppError(409, "Task is not ready for review");
    // Every staged input influenced the proposal, including unchanged state.
    for (const [p, expected] of Object.entries(s.baseline || {})) {
      const current = await this.files.read(p).catch(() => null);
      if (current?.hash !== expected)
        throw new AppError(409, `External change conflicts with ${p}`);
    }
    const changes = await this.diff(id);
    if (!changes.length) throw new AppError(409, "No file changes to import");
    if (changes.some((c) => !c.allowed))
      throw new AppError(
        403,
        "Agent changed protected files. Changes were not imported. Discard or repair the staging copy.",
      );
    for (const c of changes) {
      const old = await this.files.read(c.path).catch(() => null);
      if ((old?.hash || null) !== (s.baseline?.[c.path] || null))
        throw new AppError(409, `External change conflicts with ${c.path}`);
    }
    await this.validate(s, await this.files.safe(s.stage!, true));
    const journal = `.english-web/import-${s.id}.json`;
    await this.files.write(
      journal,
      JSON.stringify({ changes, baseline: s.baseline }),
      null,
      true,
    );
    for (const c of changes)
      await this.files.write(
        c.path,
        c.after,
        s.baseline?.[c.path] || null,
        true,
      );
    await fs.unlink(await this.files.safe(journal, true));
    s.status = "completed";
    await this.save(s);
    return s;
  }
  async cancel(id: string) {
    const s = this.get(id);
    const controller = this.running.get(id);
    if (controller) controller.abort();
    else if (s.status === "review") {
      s.status = "discarded";
      await this.save(s);
    }
    return s;
  }
  async close() {
    for (const c of this.running.values()) c.abort();
    for (let i = 0; i < 50 && this.running.size; i++)
      await new Promise((r) => setTimeout(r, 100));
  }
}
