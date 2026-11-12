import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Files, category, metadata } from "../server/src/files.js";
import { project, parseUnits, setField } from "../server/src/project.js";
import { createApp } from "../server/src/app.js";
import {
  normalize,
  capabilities,
  type Provider,
  type RunOptions,
} from "../server/src/agents/provider.js";
import { preflight } from "../server/src/agents/workflows.js";
import { fixture } from "./fixture.js";
const header = { "x-english-client": "1" };
class Mock implements Provider {
  id = "mock";
  constructor(public behavior = "success") {}
  async detect() {
    return {
      id: this.id,
      name: "Test-only provider",
      installed: true,
      available: this.behavior !== "auth",
      version: "test",
      authentication: this.behavior === "auth" ? "not authenticated" : "ready",
      reason: "Test authentication missing",
      capabilities: {
        ...capabilities,
        readOnly: this.behavior !== "unsupported",
      },
    };
  }
  async run(o: RunOptions) {
    o.session("test-conversation");
    o.emit("response", "Hello learner");
    if (this.behavior === "error")
      throw new Error("Simulated execution failure");
    if (this.behavior === "wait") {
      await new Promise<void>((resolve) =>
        o.signal.addEventListener("abort", () => resolve(), { once: true }),
      );
      throw new Error("Canceled");
    }
    if (o.mutating) {
      await fs.mkdir(path.join(o.cwd, "practice/generated"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(o.cwd, "practice/generated/test.md"),
        "# New practice\nA useful exercise.",
      );
    }
  }
}
async function settled(sessions: any, id: string) {
  for (let i = 0; i < 100; i++) {
    if (!sessions.running.has(id) && sessions.get(id).status !== "running")
      return sessions.get(id);
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("Session did not settle");
}
test("policy, traversal, symlink, conflict, CRUD, metadata and curriculum", async () => {
  const root = await fixture();
  try {
    const f = new Files(root);
    assert.equal(category("practice/writing/x.md"), "learner");
    assert.equal(category("study-plans/cycle-001/overview.md"), "education");
    for (const p of [
      "../README.md",
      "/etc/passwd",
      "practice/../../secret.md",
      "practice\\x.md",
      ".git/config",
      "practice/x:stream.md",
    ])
      await assert.rejects(() => f.read(p));
    await fs.symlink(os.tmpdir(), path.join(root, "practice/escape"));
    await assert.rejects(() => f.write("practice/escape/x.md", "bad", null));
    await assert.rejects(() =>
      f.write("curriculum/master-curriculum.md", "bad", null),
    );
    const d = await f.write("practice/notes/a.md", "# Note", null);
    await assert.rejects(() => f.write(d.path, "changed", "wrong"));
    const saved = await f.write(d.path, "# Edited", d.hash);
    const deleted = await f.trash(saved.path, saved.hash);
    assert.match((await f.read(deleted.trash, true)).content, /# Edited/);
    assert.equal(
      metadata(
        "study-plans/cycle-001/week-01/lesson-01.md",
        "# C001-L01 — Hi\nU-001",
      ).id,
      "C001-L01",
    );
    const p = await project(f);
    assert.equal(p.units.length, 40);
    assert.equal(p.documents.filter((d) => d.id).length, 24);
    assert.equal(p.documents.filter((d) => d.id)[0].id, "C001-L01");
    assert.equal(
      parseUnits((await f.read("curriculum/master-curriculum.md")).content)[0]
        .phase,
      "P1",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("API read/edit protections, origins, progress consistency and external refresh", async () => {
  const root = await fixture();
  const { app } = await createApp(root, []);
  try {
    const read = await app.inject(
      "/api/documents?path=curriculum/master-curriculum.md",
    );
    assert.equal(read.statusCode, 200);
    const lesson = await app.inject(
      "/api/documents?path=study-plans/cycle-001/week-01/lesson-01.md",
    );
    assert.match(lesson.json().content, /C001-L01/);
    assert.equal(
      (
        await app.inject({
          method: "PUT",
          url: "/api/documents",
          headers: header,
          payload: {
            path: "study-plans/cycle-001/week-01/lesson-01.md",
            content: "bad",
            hash: null,
          },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/progress",
          headers: { ...header, origin: "https://evil.test" },
          payload: {},
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (await app.inject({ method: "POST", url: "/api/progress", payload: {} }))
        .statusCode,
      403,
    );
    let r = await app.inject({
      method: "PUT",
      url: "/api/documents",
      headers: header,
      payload: {
        path: "practice/notes/test.md",
        content: "# First",
        hash: null,
      },
    });
    assert.equal(r.statusCode, 200);
    const first = r.json();
    r = await app.inject({
      method: "PUT",
      url: "/api/documents",
      headers: header,
      payload: { ...first, content: "# Second" },
    });
    assert.equal(r.statusCode, 200);
    const second = r.json();
    r = await app.inject({
      method: "POST",
      url: "/api/documents/rename",
      headers: header,
      payload: {
        path: first.path,
        to: "practice/notes/renamed.md",
        hash: second.hash,
      },
    });
    assert.equal(r.statusCode, 200);
    r = await app.inject({
      method: "DELETE",
      url: "/api/documents",
      headers: header,
      payload: { path: "practice/notes/renamed.md", hash: second.hash },
    });
    assert.equal(r.statusCode, 200);
    r = await app.inject({
      method: "POST",
      url: "/api/progress",
      headers: header,
      payload: {
        id: "C001-L01",
        status: "completed",
        grammar: "Article choice was difficult",
      },
    });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().cycleStatus, "in-progress");
    assert.equal(
      r.json().documents.find((d: any) => d.id === "C001-L01").status,
      "completed",
    );
    const current = await fs.readFile(
      path.join(root, "state/current-cycle.md"),
      "utf8",
    );
    assert.match(current, /Completed lesson IDs in active cycle:\*\* C001-L01/);
    assert.match(
      await fs.readFile(path.join(root, "state/learning-record.md"), "utf8"),
      /Article choice was difficult/,
    );
    const revision = r.json().revision;
    await fs.writeFile(
      path.join(root, "practice/writing/external.md"),
      "# External draft",
    );
    const updated = (await app.inject("/api/project")).json();
    assert.notEqual(updated.revision, revision);
    assert.ok(updated.documents.some((d: any) => d.title === "External draft"));
    const check = await preflight(new Files(root), "cycle");
    assert.equal(check.override, true);
    assert.equal(check.next, "002");
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("provider event normalization checks structured failure and preserves ids", () => {
  assert.equal(
    normalize({ type: "result", session_id: "abc", result: "OK" }).session,
    "abc",
  );
  assert.equal(
    normalize({
      type: "result",
      is_error: true,
      result: "Authentication missing",
    }).failed,
    true,
  );
  assert.equal(
    normalize({ type: "result", permission_denials: [{}] }).failed,
    true,
  );
  assert.equal(
    normalize({
      type: "assistant",
      message: { content: [{ text: "Hello" }] },
    }).text,
    "Hello",
  );
});
test("mock lifecycle: streaming, persistence, resume, failure, cancellation, auth and unsupported mode", async () => {
  for (const behavior of ["success", "error", "wait", "auth", "unsupported"]) {
    const root = await fixture();
    const { app, sessions } = await createApp(root, [new Mock(behavior)]);
    try {
      const request = { provider: "mock", workflow: "ask", prompt: "Hello" };
      if (["auth", "unsupported"].includes(behavior)) {
        await assert.rejects(() => sessions.start(request));
        continue;
      }
      const s = await sessions.start(request);
      if (behavior === "wait") await sessions.cancel(s.id);
      const result = await settled(sessions, s.id);
      assert.equal(
        result.status,
        behavior === "success"
          ? "completed"
          : behavior === "error"
            ? "failed"
            : "canceled",
      );
      assert.ok(result.events.some((e: any) => e.text === "Hello learner"));
      if (behavior === "success") {
        const continued = await sessions.start({ ...request, resume: s.id });
        await settled(sessions, continued.id);
        assert.equal(continued.providerSessionId, "test-conversation");
        const disk = await fs.readFile(
          path.join(root, `.english-web/sessions/${s.id}.json`),
          "utf8",
        );
        assert.match(disk, /test-conversation/);
      }
    } finally {
      await app.close();
      await fs.rm(root, { recursive: true, force: true });
    }
  }
});
test("staged generation requires confirmation, locks writes, validates and imports new practice", async () => {
  const root = await fixture();
  const { app, sessions } = await createApp(root, [new Mock()]);
  try {
    await assert.rejects(() =>
      sessions.start({
        provider: "mock",
        workflow: "practice",
        prompt: "Articles",
      }),
    );
    const check = await preflight(new Files(root), "practice");
    const s = await sessions.start({
      provider: "mock",
      workflow: "practice",
      prompt: "Articles",
      token: check.token,
    });
    await settled(sessions, s.id);
    assert.equal(s.status, "review");
    assert.equal(sessions.busy(), true);
    await assert.rejects(() =>
      fs.readFile(path.join(root, "practice/generated/test.md")),
    );
    const diff = await sessions.diff(s.id);
    assert.equal(diff.length, 1);
    assert.equal(diff[0].allowed, true);
    await sessions.apply(s.id);
    assert.equal(s.status, "completed");
    assert.match(
      await fs.readFile(path.join(root, "practice/generated/test.md"), "utf8"),
      /New practice/,
    );
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("external body edits refresh, malformed/draft generation guards and protected proposal rejection", async () => {
  const root = await fixture();
  const { app, files, sessions } = await createApp(root, [new Mock()]);
  try {
    const before = await project(files);
    const p = "study-plans/cycle-001/week-01/lesson-01.md";
    await fs.appendFile(
      path.join(root, p),
      "\nExternal correction to lesson body.",
    );
    assert.notEqual((await project(files)).revision, before.revision);
    await fs.mkdir(path.join(root, "study-plans/cycle-002"));
    assert.match((await preflight(files, "cycle")).blocked, /draft/);
    await fs.rmdir(path.join(root, "study-plans/cycle-002"));
    const preview = await preflight(files, "cycle");
    await assert.rejects(
      () =>
        sessions.start({
          provider: "mock",
          workflow: "cycle",
          prompt: "Generate",
          token: preview.token,
        }),
      /override/,
    );
    const practice = await preflight(files, "practice");
    const s = await sessions.start({
      provider: "mock",
      workflow: "practice",
      prompt: "Practice",
      token: practice.token,
    });
    await settled(sessions, s.id);
    const r = await app.inject({
      method: "POST",
      url: "/api/progress",
      headers: header,
      payload: { id: "C001-L01", status: "completed" },
    });
    assert.equal(r.statusCode, 409);
    await fs.appendFile(
      path.join(root, s.stage!, p),
      "\nForbidden replacement",
    );
    await assert.rejects(() => sessions.apply(s.id), /protected/);
    assert.doesNotMatch(
      await fs.readFile(path.join(root, p), "utf8"),
      /Forbidden/,
    );
    await sessions.cancel(s.id);
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("new cycle import validates 24 sessions and preserves original cycle", async () => {
  const root = await fixture();
  class CycleMock extends Mock {
    async run(o: RunOptions) {
      o.session("cycle-fixture");
      const stage = new Files(o.cwd);
      for (const d of await stage.list()) {
        if (!d.path.startsWith("study-plans/cycle-001/")) continue;
        const text = (await stage.read(d.path)).content
          .replaceAll("C001-", "C002-")
          .replaceAll("cycle-001", "cycle-002");
        await stage.write(
          d.path.replace("cycle-001", "cycle-002"),
          text,
          null,
          true,
        );
      }
      const current = await stage.read("state/current-cycle.md");
      let next = current.content
        .replaceAll("cycle-001", "cycle-002")
        .replaceAll("C001-", "C002-");
      next = setField(next, "Status", "planned");
      next = setField(
        next,
        "Completed lesson IDs in active cycle",
        "none reported",
      );
      next = setField(
        next,
        "Completed weekly review IDs in active cycle",
        "none reported",
      );
      await stage.write(current.path, next, current.hash, true);
      const ledger = await stage.read("state/cycle-ledger.md");
      await stage.write(
        ledger.path,
        ledger.content +
          "\n| cycle-002 | overview | test | planned | 0 | 0 | — | Fixture only |\n",
        ledger.hash,
        true,
      );
    }
  }
  const { app, files, sessions } = await createApp(root, [new CycleMock()]);
  try {
    const original = (
      await files.read("study-plans/cycle-001/week-01/lesson-01.md")
    ).hash;
    const preview = await preflight(files, "cycle");
    const s = await sessions.start({
      provider: "mock",
      workflow: "cycle",
      prompt: "Generate",
      token: preview.token,
      override: true,
    });
    await settled(sessions, s.id);
    assert.equal(s.status, "review", JSON.stringify(s.events));
    await sessions.apply(s.id);
    const p = await project(files);
    assert.equal(p.activeCycle, "cycle-002");
    assert.equal(
      p.documents.filter((d) => d.cycle === "cycle-002" && d.id).length,
      24,
    );
    assert.equal(
      (await files.read("study-plans/cycle-001/week-01/lesson-01.md")).hash,
      original,
    );
    assert.equal(
      p.documents.filter(
        (d) => d.cycle === "cycle-002" && d.status === "completed",
      ).length,
      0,
    );
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("only canonical lesson paths supply progress identities", () => {
  for (const p of [
    "practice/notes/C001-L01.md",
    "practice/notes/cycle-001/week-01/lesson-01.md",
    "study-plans/cycle-001/week-02/lesson-01.md",
    "study-plans/cycle-002/week-01/lesson-01.md",
  ])
    assert.equal(metadata(p, "# C001-L01 — My notes").id, undefined);
  assert.equal(
    metadata("study-plans/cycle-001/week-01/review.md", "# C001-R01 — Review")
      .id,
    "C001-R01",
  );
});

test("recovery journals block editing and new mutations after restart", async () => {
  const root = await fixture();
  const { app, files, sessions } = await createApp(root, [new Mock()]);
  try {
    for (const journal of [
      "progress-pending.json",
      "import-interrupted.json",
    ]) {
      await files.write(`.english-web/${journal}`, "{}", null, true);
      for (const [url, payload, method] of [
        [
          "/api/documents",
          { path: "practice/notes/new.md", content: "# Note", hash: null },
          "PUT",
        ],
        ["/api/progress", { id: "C001-L01", status: "completed" }, "POST"],
        ["/api/mistakes", { original: "example" }, "POST"],
      ] as const) {
        const response = await app.inject({
          method,
          url,
          payload,
          headers: header,
        });
        assert.equal(response.statusCode, 409, response.body);
        assert.match(response.json().message, /recovery/);
      }
      await assert.rejects(
        () =>
          sessions.start({
            provider: "mock",
            workflow: "practice",
            prompt: "Practice",
          }),
        /recovery/,
      );
      assert.equal((await app.inject("/api/project")).statusCode, 200);
      await fs.unlink(path.join(root, ".english-web", journal));
    }
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("import rejects changes to unchanged proposal inputs and pending recovery", async () => {
  const root = await fixture();
  const { app, files, sessions } = await createApp(root, [new Mock()]);
  try {
    const preview = await preflight(files, "practice");
    const s = await sessions.start({
      provider: "mock",
      workflow: "practice",
      prompt: "Practice",
      token: preview.token,
    });
    await settled(sessions, s.id);
    await files.write(".english-web/progress-pending.json", "{}", null, true);
    await assert.rejects(() => sessions.apply(s.id), /recovery/);
    await fs.unlink(path.join(root, ".english-web/progress-pending.json"));
    await fs.appendFile(
      path.join(root, "state/learning-record.md"),
      "\nNew external evidence\n",
    );
    await assert.rejects(
      () => sessions.apply(s.id),
      /External change conflicts/,
    );
    await assert.rejects(() => files.read("practice/generated/test.md"));
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("cancellation during validation never leaves an importable proposal", async () => {
  const root = await fixture();
  const { app, files, sessions } = await createApp(root, [new Mock()]);
  try {
    let entered!: () => void;
    let release!: () => void;
    const validating = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const proceed = new Promise<void>((resolve) => {
      release = resolve;
    });
    sessions.validate = async () => {
      entered();
      await proceed;
    };
    const preview = await preflight(files, "practice");
    const s = await sessions.start({
      provider: "mock",
      workflow: "practice",
      prompt: "Practice",
      token: preview.token,
    });
    await validating;
    await sessions.cancel(s.id);
    release();
    await settled(sessions, s.id);
    assert.equal(s.status, "canceled");
    await assert.rejects(() => sessions.apply(s.id), /not ready/);
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("customization validates values, rejects conflicts and requires setup before generation", async () => {
  const root = await fixture();
  const { app, files } = await createApp(root, []);
  try {
    const old = await files.read("docs/LEARNER_PROFILE.md");
    await files.write(old.path, "# Not configured\n", old.hash, true);
    assert.match(
      (await preflight(files, "initialize")).blocked,
      /customization/,
    );
    const current = (await app.inject("/api/preferences")).json();
    assert.equal(current.preferences, null);
    const preferences = {
      targetLanguage: "French",
      primaryLanguage: "",
      level: "unknown",
      goals: "Travel",
      weaknesses: "Listening",
      interests: "Food",
      constraints: "",
      budget: "free",
      lessonMinutes: 30,
      sessionsPerWeek: 2,
      defaultLessonCount: 1,
      includeReviews: false,
    };
    const save = (payload: Record<string, unknown>) =>
      app.inject({
        method: "PUT",
        url: "/api/preferences",
        headers: header,
        payload,
      });
    assert.equal(
      (
        await save({
          preferences: { ...preferences, lessonMinutes: 0 },
          hash: current.hash,
        })
      ).statusCode,
      400,
    );
    assert.equal((await save({ preferences, hash: "stale" })).statusCode, 409);
    assert.equal(
      (await save({ preferences, hash: current.hash })).statusCode,
      200,
    );
    assert.equal(
      (await app.inject("/api/project")).json().preferences.targetLanguage,
      "French",
    );
    const preview = await preflight(files, "cycle", 1);
    assert.match(preview.plan, /Session minutes:\*\* 30/);
    assert.match(preview.plan, /Review count:\*\* 0/);
    assert.notEqual(preview.token, (await preflight(files, "cycle", 2)).token);
    await files.write(".english-web/progress-pending.json", "{}", null, true);
    assert.equal(
      (await save({ preferences, hash: current.hash })).statusCode,
      409,
    );
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("single lesson staging enforces requested duration, preserves history and completes from explicit evidence", async () => {
  const root = await fixture();
  class SingleLessonMock extends Mock {
    async run(o: RunOptions) {
      const f = new Files(o.cwd);
      const template = (
        await f.read("study-plans/cycle-001/week-01/lesson-01.md")
      ).content;
      await f.write(
        "study-plans/cycle-002/week-01/lesson-01.md",
        template.replaceAll("C001-", "C002-").replace("| 120 |", "| 30 |"),
        null,
        true,
      );
      await f.write(
        "study-plans/cycle-002/overview.md",
        "# One lesson\n[Lesson](week-01/lesson-01.md)",
        null,
        true,
      );
      const current = await f.read("state/current-cycle.md");
      await f.write(
        current.path,
        current.content.replaceAll("cycle-001", "cycle-002"),
        current.hash,
        true,
      );
      const ledger = await f.read("state/cycle-ledger.md");
      await f.write(
        ledger.path,
        ledger.content +
          "\n| cycle-002 | overview | test | planned | 0 | 0 | — | Test |\n",
        ledger.hash,
        true,
      );
    }
  }
  const { app, files, sessions } = await createApp(root, [
    new SingleLessonMock(),
  ]);
  try {
    const old = (await app.inject("/api/preferences")).json();
    await app.inject({
      method: "PUT",
      url: "/api/preferences",
      headers: header,
      payload: {
        hash: old.hash,
        preferences: {
          ...old.preferences,
          lessonMinutes: 30,
          defaultLessonCount: 1,
          includeReviews: false,
        },
      },
    });
    const preview = await preflight(files, "cycle", 1);
    const s = await sessions.start({
      provider: "mock",
      workflow: "cycle",
      prompt: "One lesson",
      lessonCount: 1,
      token: preview.token,
      override: true,
    });
    await settled(sessions, s.id);
    assert.equal(s.status, "review", JSON.stringify(s.events));
    const stage = new Files(path.join(root, s.stage!));
    const plan = await stage.read("study-plans/cycle-002/plan.md");
    const changed = await stage.write(
      plan.path,
      plan.content.replace("30", "60"),
      plan.hash,
      true,
    );
    await assert.rejects(() => sessions.apply(s.id));
    await stage.write(plan.path, plan.content, changed.hash, true);
    await sessions.apply(s.id);
    assert.equal((await project(files)).cycleStatus, "planned");
    const completed = await app.inject({
      method: "POST",
      url: "/api/progress",
      headers: header,
      payload: { id: "C002-L01", status: "completed" },
    });
    assert.equal(completed.statusCode, 200, completed.body);
    assert.equal(completed.json().cycleStatus, "completed");
    assert.equal(
      completed
        .json()
        .documents.filter((d: any) => d.cycle === "cycle-001" && d.id).length,
      24,
    );
  } finally {
    await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
