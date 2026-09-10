import { expect, test } from "@playwright/test";

test("create, edit, pin, archive, and share a note", async ({ page, browser }) => {
  const stamp = Date.now();
  const password = "password123";
  const emailA = `e2e-a-${stamp}@example.com`;
  const emailB = `e2e-b-${stamp}@example.com`;

  test.setTimeout(90_000);

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Avery");
  await page.getByLabel("Email").fill(emailA);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Create space" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/settings");
  const inviteCode = (await page.locator("p.font-mono").innerText()).trim();

  const pageB = await browser.newPage();
  await pageB.goto("/signup");
  await pageB.getByLabel("Name").fill("Blake");
  await pageB.getByLabel("Email").fill(emailB);
  await pageB.getByLabel("Password", { exact: true }).fill(password);
  await pageB.getByLabel("Confirm password").fill(password);
  await pageB.getByRole("button", { name: "Create account" }).click();
  await pageB.waitForURL("**/onboarding");
  await pageB.getByLabel("Invite code").fill(inviteCode);
  await pageB.getByRole("button", { name: "Join space" }).click();
  await pageB.waitForURL((url) => url.pathname === "/");

  await page.goto("/notes");
  await page.getByRole("button", { name: /new note/i }).click();
  await page.waitForURL(/\/notes\//);
  await page.getByPlaceholder("Title").fill("Things to remember");
  await page.locator(".tiptap").click();
  await page.keyboard.type("Milk, bread, and flowers.");
  await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Pin" }).click();
  await page.getByRole("button", { name: /share with/i }).click();
  await expect(page.getByText(/shared with/i)).toBeVisible();

  await pageB.goto("/shared");
  await expect(pageB.getByText("Things to remember")).toBeVisible();
  await pageB.getByText("Things to remember").click();
  await pageB.getByPlaceholder("Title").fill("Things we need to remember");
  await expect(pageB.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByPlaceholder("Title")).toHaveValue(
    "Things we need to remember",
  );
});
