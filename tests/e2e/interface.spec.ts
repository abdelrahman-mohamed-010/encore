import { expect, test } from "@playwright/test";

test.describe("theme", () => {
  test("switches to dark and survives a reload", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Change theme" }).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("respects the operating system preference by default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("navigation", () => {
  test("the header links reach the main areas of the site", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) test.skip(true, "The desktop nav is collapsed on small screens.");

    await page.getByRole("link", { name: "Browse", exact: true }).click();
    await expect(page).toHaveURL(/\/events/);
  });

  test("an unknown route returns a 404", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-route");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("We could not find that page")).toBeVisible();
  });

  test("an unknown event slug shows the not-found page instead of an error", async ({ page }) => {
    // Next 16 streams a 200 for a programmatic notFound() inside a dynamic
    // route, so this asserts what the app controls: the visitor lands on the
    // not-found UI with a way back, rather than a crash or an empty page.
    await page.goto("/events/this-event-does-not-exist");
    await expect(page.getByText("We could not find that page")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse events" })).toBeVisible();
  });
});

test.describe("accessibility basics", () => {
  test("every page has exactly one h1 and a document title", async ({ page }) => {
    for (const path of ["/", "/events", "/categories", "/organizers", "/pricing"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Tazkarti/);
    }
  });

  test("images that carry no meaning are hidden from screen readers", async ({ page }) => {
    await page.goto("/events");
    const decorative = page.locator('img[alt=""]');
    expect(await decorative.count()).toBeGreaterThan(0);
  });

  test("the page does not scroll sideways on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/events/cairokee-roots-live");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
