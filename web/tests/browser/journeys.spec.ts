import { test, expect } from "@playwright/test";
test("dashboard, lesson, progress, notes, live events and external cycle discovery", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A little practice. Lasting progress." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Study Plan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "One week at a time." }),
  ).toBeVisible();
  await page.getByRole("link").filter({ hasText: "C001-L01" }).first().click();
  await expect(page.getByRole("heading", { name: /C001-L01 —/ })).toBeVisible();
  await page
    .getByText("Record session progress / difficulty", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("completed");
  await page.getByRole("button", { name: "Save progress" }).click();
  await expect(
    page.getByText("Recorded your self-report. No mastery inferred."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add note", exact: true }).click();
  await page
    .getByLabel("Markdown content")
    .fill("# My first note\n\nI practiced a clear introduction.");
  await page
    .getByRole("button", { name: "Save document", exact: true })
    .click();
  await expect(page.getByLabel("Markdown content")).toHaveValue(
    /clear introduction/,
  );
  await page
    .getByLabel("Markdown content")
    .fill("# My first note\n\nA revised reflection.");
  await page
    .getByRole("button", { name: "Save document", exact: true })
    .click();
  await expect(page.getByText("Saved to your project.")).toBeVisible();
  await page.getByRole("link", { name: "AI Agents", exact: true }).click();
  await page
    .getByRole("button", { name: /Codex \(browser test mock\)/ })
    .click();
  await page.getByLabel("Your instructions").fill("Explain articles briefly.");
  await page.getByRole("button", { name: "Send instructions →" }).click();
  await expect(
    page.getByText("Here is a useful practice explanation."),
  ).toBeVisible();
  await expect(page.locator(".conversation .pill")).toHaveText("completed");
  await request.post("/api/test/discover", {
    headers: { "x-english-client": "1" },
    data: {},
  });
  await page.getByRole("button", { name: "Refresh project" }).click();
  await page.getByRole("link", { name: "Study Plan", exact: true }).click();
  await expect(page.getByRole("link", { name: /cycle-002 ·/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile navigation and sanitized untrusted Markdown", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "My Notes", exact: true }).click();
  await page.getByRole("link", { name: "+ New document" }).click();
  await page
    .getByLabel("Markdown content")
    .fill(
      '# Safety\n<script>window.compromised=true</script>\n<img src=x onerror="window.compromised=true">\n[bad](javascript:alert(1))',
    );
  await expect(page.locator(".editor .markdown script")).toHaveCount(0);
  expect(
    await page.evaluate(() => Reflect.get(window, "compromised")),
  ).toBeUndefined();
  await page.screenshot({
    path: "test-results/editor-mobile.png",
    fullPage: true,
  });
});

test("fresh project starts with customization and continues to strategy generation", async ({ page, request }) => {
  await request.post("/api/test/fresh", { headers: { "x-english-client": "1" }, data: {} });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build your learning path" })).toBeVisible();
  await page.getByLabel("Language to learn").fill("Spanish");
  await page.getByLabel("What do you want to achieve?").fill("Travel conversations");
  await page.getByLabel("Weak points or skills to focus on (optional)").fill("Understanding spoken language");
  await page.getByLabel("Minutes per session (60 = 1 hour)").fill("30");
  await page.getByLabel("Study sessions per week").fill("2");
  await page.screenshot({ path: "test-results/customization-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/customization-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByLabel("Workflow")).toHaveValue("initialize");
  const saved = await request.get("/api/preferences");
  expect((await saved.json()).preferences.lessonMinutes).toBe(30);
  await page.reload();
  await expect(page.getByLabel("Workflow")).toHaveValue("initialize");
});
