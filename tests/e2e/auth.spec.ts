import { expect, test } from "@playwright/test";

test.describe("authentication", () => {
  test("the sign-in form reports bad credentials without leaking which part was wrong", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("That email and password do not match an account."),
    ).toBeVisible();
  });

  test("registration validates the password length before calling the server", async ({ page }) => {
    await page.goto("/auth/register");

    await page.getByLabel("Full name").fill("Nour Ibrahim");
    await page.getByLabel("Email").fill("nour@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  });

  test("protected routes bounce anonymous visitors to sign in and remember where they were going", async ({
    page,
  }) => {
    await page.goto("/account/tickets");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Faccount%2Ftickets/);
  });

  test("the dashboard is protected too", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
