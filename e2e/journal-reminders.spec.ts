import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("journal date navigation and reminder complete", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-j-${stamp}@example.com`;
  const password = "password123";

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Jordan");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Create space" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/journal");
  await page.getByRole("button", { name: "Write today" }).click();
  await page.waitForURL(/\/journal\/\d{4}-\d{2}-\d{2}/);
  await page.getByPlaceholder("Title").fill("Today");
  await page.locator(".tiptap").click();
  await page.keyboard.type("Today was a good day.");
  await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("link", { name: "Today" }).click();

  await page.goto("/");
  await page.getByRole("button", { name: "Create" }).first().click();
  await page.getByRole("button", { name: "New Reminder" }).click();
  await page.getByLabel("Title").fill("Call mom");
  const due = new Date(Date.now() + 60 * 60 * 1000);
  const local = new Date(due.getTime() - due.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("When").fill(local);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Call mom")).toBeVisible();
  await page.getByRole("button", { name: "Complete" }).click();
  await expect(page.getByText("Call mom")).toHaveCount(0);

  await page.getByRole("button", { name: "Create" }).first().click();
  await page.getByRole("button", { name: "New Reminder" }).click();
  await page.getByLabel("Title").fill("Delete this reminder");
  await page.getByLabel("When").fill(local);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Delete this reminder")).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete this reminder")).toHaveCount(0);

  await page.getByRole("button", { name: "Create" }).first().click();
  await page.getByRole("button", { name: "New Event" }).click();
  await page.getByLabel("Title").fill("Delete this event");
  await page.getByLabel("Starts").fill(local);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Delete this event")).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete this event")).toHaveCount(0);
});
