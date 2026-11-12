import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fixture } from "./fixture.js";
import { planText } from "../server/src/preferences.js";
import { metadata } from "../server/src/files.js";

test("batch validator accepts partial and maximum batches, rejects missing sessions and wrong timing", async () => {
  const root = await fixture();
  try {
    const template = await fs.readFile(path.join(root, "study-plans/cycle-001/week-01/lesson-01.md"), "utf8");
    const cycle = path.join(root, "study-plans/cycle-002");
    const validate = () => execFileSync(process.env.ENGLISH_PYTHON || "python3", [path.join(root, "tools/validate_project.py"), "--cycle", "002"], { encoding: "utf8", stdio: "pipe" });
    for (const [count, reviews] of [[1, false], [6, true], [40, true]] as const) {
      await fs.rm(cycle, { recursive: true, force: true });
      await fs.mkdir(cycle, { recursive: true });
      await fs.writeFile(path.join(cycle, "plan.md"), planText(count, 45, reviews));
      const links: string[] = [];
      for (let n = 1; n <= count; n++) {
        const week = String(Math.ceil(n / 5)).padStart(2, "0");
        const number = String(n).padStart(2, "0");
        const p = `week-${week}/lesson-${number}.md`;
        await fs.mkdir(path.join(cycle, `week-${week}`), { recursive: true });
        const content = template.replace("C001-L01", `C002-L${number}`).replace("| 120 |", "| 45 |");
        await fs.writeFile(path.join(cycle, p), content);
        assert.equal(metadata(`study-plans/cycle-002/${p}`, content).id, `C002-L${number}`);
        links.push(`[Lesson](${p})`);
        if (reviews && (n % 5 === 0 || n === count)) {
          await fs.writeFile(path.join(cycle, `week-${week}/review.md`), content.replace(`C002-L${number}`, `C002-R${week}`));
          links.push(`[Review](week-${week}/review.md)`);
        }
      }
      await fs.writeFile(path.join(cycle, "overview.md"), links.join("\n"));
      assert.match(validate(), /PASS/);
    }
    const first = path.join(cycle, "week-01/lesson-01.md");
    await fs.appendFile(first, "\n<!-- ACTIVITY_TABLE_START -->\n");
    assert.throws(validate);
    await fs.rm(first);
    assert.throws(validate);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
