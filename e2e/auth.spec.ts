import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("signup, login, logout, and duplicate email", async ({ page, context }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "password123";

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Alex");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");

  await page.getByLabel("Space name").fill("Our Space");
  await page.getByRole("button", { name: "Create space" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading").first()).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  const second = await context.newPage();
  await second.goto("/signup");
  await second.getByLabel("Name").fill("Alex");
  await second.getByLabel("Email").fill(email);
  await second.getByLabel("Password", { exact: true }).fill(password);
  await second.getByLabel("Confirm password").fill(password);
  await second.getByRole("button", { name: "Create account" }).click();
  await expect(second.getByText(/already exists/i)).toBeVisible();
});
